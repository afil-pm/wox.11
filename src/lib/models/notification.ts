import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  userId: string;
  title: string;
  body: string;
  type: "order_update" | "message_reply" | "new_product" | "coupon" | "general";
  orderId?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ["order_update", "message_reply", "new_product", "coupon", "general"], default: "general" },
    orderId: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

let Notification: Model<INotification>;

try {
  Notification = mongoose.model<INotification>("Notification");
} catch {
  Notification = mongoose.model<INotification>("Notification", NotificationSchema);
}

export default Notification;
