import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "order_update"
  | "message_reply"
  | "new_product"
  | "coupon"
  | "supplier_verification"
  | "supplier_alert"
  | "general";

export interface INotification extends Document {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  orderId?: string;
  /** In-app destination used when the notification row is clicked. */
  url?: string;
  /**
   * Stable key of the logical event that produced this notification
   * (e.g. `supplier:<id>:verified`). Used to guarantee a verification event
   * is recorded — and pushed — exactly once.
   */
  dedupeKey?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "order_update",
        "message_reply",
        "new_product",
        "coupon",
        "supplier_verification",
        "supplier_alert",
        "general",
      ],
      default: "general",
    },
    orderId: { type: String, default: null },
    url: { type: String, default: null },
    dedupeKey: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
// One row per logical event: the unique index is the hard guarantee that a
// retried or double-submitted event cannot create duplicates.
NotificationSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);

let Notification: Model<INotification>;

try {
  Notification = mongoose.model<INotification>("Notification");
} catch {
  Notification = mongoose.model<INotification>("Notification", NotificationSchema);
}

export default Notification;
