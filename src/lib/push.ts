import webPush from "web-push";
import { connectMongoDB } from "@/lib/mongodb";
import PushSubscription from "@/lib/models/push-subscription";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidEmail = process.env.VAPID_EMAIL || "mailto:info.afilpm@gmail.com";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  try {
    await connectMongoDB();
    const subscriptions = await PushSubscription.find({ userId }).lean();

    if (subscriptions.length === 0) return;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: payload.badge || "/icons/icon-72x72.png",
      url: payload.url || "/",
      tag: payload.tag || "wox-notification",
      data: payload.data || {},
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload
          );
        } catch (err: unknown) {
          const error = err as { statusCode?: number };
          if (error.statusCode === 404 || error.statusCode === 410) {
            await PushSubscription.deleteOne({ endpoint: sub.endpoint }).catch(() => {});
          }
          throw err;
        }
      })
    );

    const failedCount = results.filter((r) => r.status === "rejected").length;
    if (failedCount > 0) {
      console.warn(`Push notification: ${failedCount}/${subscriptions.length} subscriptions failed for user ${userId}`);
    }
  } catch (error) {
    console.error("sendPushToUser error:", error);
  }
}

export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  try {
    await connectMongoDB();
    const subscriptions = await PushSubscription.find({}).lean();

    if (subscriptions.length === 0) return;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: payload.badge || "/icons/icon-72x72.png",
      url: payload.url || "/",
      tag: payload.tag || "wox-notification",
      data: payload.data || {},
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload
          );
        } catch (err: unknown) {
          const error = err as { statusCode?: number };
          if (error.statusCode === 404 || error.statusCode === 410) {
            await PushSubscription.deleteOne({ endpoint: sub.endpoint }).catch(() => {});
          }
          throw err;
        }
      })
    );

    const failedCount = results.filter((r) => r.status === "rejected").length;
    if (failedCount > 0) {
      console.warn(`Push broadcast: ${failedCount}/${subscriptions.length} subscriptions failed`);
    }
  } catch (error) {
    console.error("sendPushToAll error:", error);
  }
}

export function getVapidPublicKey(): string {
  return vapidPublicKey;
}
