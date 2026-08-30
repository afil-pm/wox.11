import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId?: string;
}

export interface IRefundRequest extends Document {
  orderId: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  type: "cancel_refund" | "return_refund";
  reason: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "processed" | "completed";
  bankDetails: IBankDetails;
  adminNotes: string;
  refundTransactionId: string;
  refundReferenceNumber: string;
  paymentMethod: string;
  paymentId: string;
  processedAt?: Date;
  processedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BankDetailsSchema = new Schema<IBankDetails>(
  {
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    bankName: { type: String, required: true },
    upiId: { type: String, default: "" },
  },
  { _id: false }
);

const RefundRequestSchema = new Schema<IRefundRequest>(
  {
    orderId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    type: { type: String, enum: ["cancel_refund", "return_refund"], required: true },
    reason: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processed", "completed"],
      default: "pending",
    },
    bankDetails: { type: BankDetailsSchema, required: true },
    adminNotes: { type: String, default: "" },
    refundTransactionId: { type: String, default: "" },
    refundReferenceNumber: { type: String, default: "" },
    paymentMethod: { type: String, required: true },
    paymentId: { type: String, default: "" },
    processedAt: { type: Date },
    processedBy: { type: String },
  },
  { timestamps: true }
);

RefundRequestSchema.index({ status: 1, createdAt: -1 });
RefundRequestSchema.index({ userId: 1, createdAt: -1 });

let RefundRequest: Model<IRefundRequest>;

try {
  RefundRequest = mongoose.model<IRefundRequest>("RefundRequest");
} catch {
  RefundRequest = mongoose.model<IRefundRequest>("RefundRequest", RefundRequestSchema);
}

export default RefundRequest;
