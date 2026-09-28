import { connectMongoDB } from "@/lib/mongodb";
import Notification, { NotificationType } from "@/lib/models/notification";
import { sendPushToUser } from "@/lib/push";

export interface NotifyInput {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  /** Where a click (in-app row or push) should take the user. */
  url?: string;
  /** OS level coalescing tag so repeated pushes stack as one. */
  tag?: string;
  /**
   * Stable key of the logical event (`supplier:<id>:verified`). The first
   * delivery wins: later calls with the same key are no-ops, so retries,
   * double clicks and repeated admin actions can never create duplicates.
   */
  dedupeKey?: string;
  /** Order this notification is about, so the row can be linked to it. */
  orderId?: string;
}

export interface NotifyResult {
  /** The notification row was newly stored. */
  created: boolean;
  /** At least one push subscription accepted the message. */
  pushed: boolean;
}

/**
 * Stores a notification (the durable, reload/close/session proof record) and
 * best-effort delivers it as a web push. Never throws: a notification problem
 * must not fail the business operation that triggered it.
 */
export async function notifyUser(input: NotifyInput): Promise<NotifyResult> {
  const type: NotificationType = input.type ?? "general";
  const url = input.url || "/";

  try {
    await connectMongoDB();

    if (input.dedupeKey) {
      const res = await Notification.updateOne(
        { dedupeKey: input.dedupeKey },
        {
          $setOnInsert: {
            userId: input.userId,
            title: input.title,
            body: input.body,
            type,
            url,
            dedupeKey: input.dedupeKey,
            read: false,
            ...(input.orderId ? { orderId: input.orderId } : {}),
          },
        },
        { upsert: true }
      );
      if (!res.upsertedCount) return { created: false, pushed: false };
    } else {
      await Notification.create({
        userId: input.userId,
        title: input.title,
        body: input.body,
        type,
        url,
        read: false,
        ...(input.orderId ? { orderId: input.orderId } : {}),
      });
    }

    const push = await sendPushToUser(input.userId, {
      title: input.title,
      body: input.body,
      url,
      tag: input.tag || input.dedupeKey || "wox-notification",
      data: { url },
    });

    return { created: true, pushed: push.sent > 0 };
  } catch (error) {
    console.error("notifyUser error:", error);
    return { created: false, pushed: false };
  }
}
