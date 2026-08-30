import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  applicableProducts: string[];
  allProducts: boolean;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["fixed", "percent"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    applicableProducts: { type: [String], default: [] },
    allProducts: { type: Boolean, default: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ active: 1 });

let Coupon: Model<ICoupon>;

try {
  Coupon = mongoose.model<ICoupon>("Coupon");
} catch {
  Coupon = mongoose.model<ICoupon>("Coupon", CouponSchema);
}

export default Coupon;
