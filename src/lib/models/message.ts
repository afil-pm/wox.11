import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  type: "account-recovery";
  senderEmail: string;
  senderUserId: string;
  senderName: string;
  message: string;
  status: "pending" | "reviewing" | "resolved" | "rejected" | "received" | "complete";
  adminReply: string;
  keyDeliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    type: { type: String, default: "account-recovery", required: true },
    senderEmail: { type: String, required: true, lowercase: true, trim: true },
    senderUserId: { type: String, default: "" },
    senderName: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "rejected", "received", "complete"],
      default: "pending",
    },
    adminReply: { type: String, default: "" },
    keyDeliveredAt: { type: Date },
  },
  { timestamps: true }
);

MessageSchema.index({ status: 1, createdAt: -1 });
MessageSchema.index({ senderEmail: 1, createdAt: -1 });

let Message: Model<IMessage>;

try {
  Message = mongoose.model<IMessage>("Message");
} catch {
  Message = mongoose.model<IMessage>("Message", MessageSchema);
}

export default Message;
