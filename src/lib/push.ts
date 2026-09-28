import webPush from "web-push";
import { connectMongoDB } from "@/lib/mongodb";
import PushSubscription from "@/lib/models/push-subscription";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidEmail = process.env.VAPID_EMAIL || "mailto:info.afilpm@gmail.com";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

/**
 * How long the push services may keep a message queued for a device that is
 * offline. Without a TTL a push that cannot be delivered right away can be
 * dropped, which is exactly how "I missed the notification while my browser
 * was closed" happens.
 */
const PUSH_TTL_SECONDS = 7 * 24 * 60 * 60;

/** One extra attempt for transient failures (device offline, network blip). */
const RETRY_DELAY_MS = 500;

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export interface PushResult {
  sent: number;
  failed: number;
}

type Subscription = { endpoint: string; p256dh: string; auth: string };

async function sendOne(sub: Subscription, notificationPayload: string): Promise<void> {
  try {
    await webPush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      notificationPayload,
      { TTL: PUSH_TTL_SECONDS }
    );
  } catch (err: unknown) {
    const error = err as { statusCode?: number };
    // Gone forever: drop the subscription so it stops failing forever.
    if (error.statusCode === 404 || error.statusCode === 410) {
      await PushSubscription.deleteOne({ endpoint: sub.endpoint }).catch(() => {});
    }
    throw err;
  }
}

async function deliver(subscriptions: Subscription[], payload: PushPayload): Promise<PushResult> {
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-72x72.png",
    url: payload.url || "/",
    tag: payload.tag || "wox-notification",
    data: payload.data || {},
  });

  const results: PromiseSettledResult<void>[] = await Promise.allSettled(
    subscriptions.map((sub) => sendOne(sub, notificationPayload))
  );

  const retryable = results
    .map((result, index) => (result.status === "rejected" ? index : -1))
    .filter((index) => index >= 0);

  if (retryable.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    const retried = await Promise.allSettled(
      retryable.map((index) => sendOne(subscriptions[index], notificationPayload))
    );
    retried.forEach((result, i) => {
      results[retryable[i]] = result;
    });
  }

  const failed = results.filter((r) => r.status === "rejected").length;
  return { sent: results.length - failed, failed };
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  if (!vapidPublicKey || !vapidPrivateKey) return { sent: 0, failed: 0 };

  try {
    await connectMongoDB();
    const subscriptions = await PushSubscription.find({ userId }).lean();
    const result = await deliver(subscriptions as Subscription[], payload);
    if (result.failed > 0) {
      console.warn(
        `Push notification: ${result.failed}/${result.sent + result.failed} subscriptions failed for user ${userId}`
      );
    }
    return result;
  } catch (error) {
    console.error("sendPushToUser error:", error);
    return { sent: 0, failed: 0 };
  }
}

export async function sendPushToAll(payload: PushPayload): Promise<PushResult> {
  if (!vapidPublicKey || !vapidPrivateKey) return { sent: 0, failed: 0 };

  try {
    await connectMongoDB();
    const subscriptions = await PushSubscription.find({}).lean();
    const result = await deliver(subscriptions as Subscription[], payload);
    if (result.failed > 0) {
      console.warn(
        `Push broadcast: ${result.failed}/${result.sent + result.failed} subscriptions failed`
      );
    }
    return result;
  } catch (error) {
    console.error("sendPushToAll error:", error);
    return { sent: 0, failed: 0 };
  }
}

export function getVapidPublicKey(): string {
  return vapidPublicKey;
}
