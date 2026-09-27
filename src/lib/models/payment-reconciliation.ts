import mongoose, { Schema, Document, Model } from "mongoose";

export type ReconciliationStatus = "UNMATCHED" | "MATCHED" | "RESOLVED" | "IGNORED";

export interface IPaymentReconciliation extends Document {
  key: string;
  paymentId: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  status: ReconciliationStatus;
  reason: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentReconciliationSchema = new Schema<IPaymentReconciliation>(
  {
    key: { type: String, required: true, unique: true },
    paymentId: { type: String, default: "" },
    razorpayOrderId: { type: String, default: "" },
    amountPaise: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    paymentMethod: { type: String, default: "" },
    paymentStatus: { type: String, default: "" },
    status: {
      type: String,
      enum: ["UNMATCHED", "MATCHED", "RESOLVED", "IGNORED"],
      default: "UNMATCHED",
    },
    reason: { type: String, default: "" },
    orderId: { type: String, default: "" },
    orderNumber: { type: String, default: "" },
    customerName: { type: String, default: "" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

PaymentReconciliationSchema.index({ status: 1, createdAt: -1 });
PaymentReconciliationSchema.index({ razorpayOrderId: 1 });

let PaymentReconciliation: Model<IPaymentReconciliation>;

try {
  PaymentReconciliation = mongoose.model<IPaymentReconciliation>("PaymentReconciliation");
} catch {
  PaymentReconciliation = mongoose.model<IPaymentReconciliation>(
    "PaymentReconciliation",
    PaymentReconciliationSchema
  );
}

export default PaymentReconciliation;
