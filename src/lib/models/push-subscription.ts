import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscription extends Document {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  { timestamps: true }
);

PushSubscriptionSchema.index({ userId: 1 });
PushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

let PushSubscription: Model<IPushSubscription>;

try {
  PushSubscription = mongoose.model<IPushSubscription>("PushSubscription");
} catch {
  PushSubscription = mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);
}

export default PushSubscription;
