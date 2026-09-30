import mongoose, { Schema, Document, Model } from "mongoose";

export const PAID_PAYMENT_STATUSES = ["PAID", "COMPLETED", "REFUNDED"] as const;

export const UNPAID_PAYMENT_STATUSES = [
  "PENDING",
  "PAYMENT_PROCESSING",
  "FAILED",
  "CANCELLED",
  "REVIEW",
] as const;

export interface IOrderItem {
  name: string;
  price: number;
  quantity: number;
  size: string;
  /** Variant colour chosen on the product page ("" for older orders). */
  color: string;
  image: string;
  slug: string;
  hsnCode: string;
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  finalAmount: number;
}

export interface IOrderTax {
  totalTaxableAmount: number;
  totalGstAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  sellerState: string;
  customerState: string;
  isInterState: boolean;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: {
    name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    taluk: string;
    district: string;
    state: string;
    pincode: string;
    landmark: string;
  };
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  taxDetails: IOrderTax;
  paymentMethod: "razorpay" | "cod";
  paymentId: string;
  paymentStatus:
    | "PENDING"
    | "PAYMENT_PROCESSING"
    | "PAID"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "REVIEW"
    | "REFUNDED";
  razorpayOrderId: string;
  checkoutSessionId?: string;
  paymentAmountPaise?: number;
  paymentCurrency?: string;
  paymentExpiresAt?: Date;
  inventoryAdjusted?: boolean;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "PACKED"
    | "SHIPPED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURNED"
    | "REFUNDED";
  notes: string;
  couponCode: string;
  couponDiscount: number;
  /** Suppliers whose products this order contains ("" entries are store owned). */
  supplierIds: string[];
  paymentConfirmedAt?: Date;
  paymentConfirmedBy?: string;
  paymentConfirmationMethod?: "online" | "manual";
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    size: { type: String, required: true },
    color: { type: String, default: "" },
    image: { type: String, default: "" },
    slug: { type: String, default: "" },
    hsnCode: { type: String, default: "6211" },
    gstRate: { type: Number, default: 5 },
    taxableAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const OrderTaxSchema = new Schema<IOrderTax>(
  {
    totalTaxableAmount: { type: Number, default: 0 },
    totalGstAmount: { type: Number, default: 0 },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalIgst: { type: Number, default: 0 },
    sellerState: { type: String, default: "Kerala" },
    customerState: { type: String, default: "" },
    isInterState: { type: Boolean, default: false },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: String, default: "" },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, required: true },
    address: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String, default: "" },
      city: { type: String, required: true },
      taluk: { type: String, default: "" },
      district: { type: String, default: "" },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: { type: String, default: "" },
    },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    taxDetails: { type: OrderTaxSchema, default: () => ({}) },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      default: "cod",
    },
    paymentId: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "PAYMENT_PROCESSING",
        "PAID",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
        "REVIEW",
        "REFUNDED",
      ],
      default: "PENDING",
    },
    razorpayOrderId: { type: String, default: "" },
    checkoutSessionId: { type: String },
    paymentAmountPaise: { type: Number },
    paymentCurrency: { type: String, default: "" },
    paymentExpiresAt: { type: Date },
    inventoryAdjusted: { type: Boolean },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
        "REFUNDED",
      ],
      default: "PENDING",
    },
    notes: { type: String, default: "" },
    couponCode: { type: String, default: "" },
    couponDiscount: { type: Number, default: 0 },
    supplierIds: { type: [String], default: [] },
    paymentConfirmedAt: { type: Date },
    paymentConfirmedBy: { type: String, default: "" },
    paymentConfirmationMethod: {
      type: String,
      enum: ["online", "manual"],
    },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ razorpayOrderId: 1 });
OrderSchema.index({ checkoutSessionId: 1 }, { unique: true, sparse: true });
OrderSchema.index({ paymentStatus: 1, paymentExpiresAt: 1 });
OrderSchema.index({ supplierIds: 1 });
// One gateway payment may settle exactly one order. The partial filter keeps
// the empty `paymentId` used by COD orders out of the uniqueness constraint.
OrderSchema.index(
  { paymentId: 1 },
  { unique: true, partialFilterExpression: { paymentId: { $type: "string", $gt: "" } } }
);

let Order: Model<IOrder>;

try {
  Order = mongoose.model<IOrder>("Order");
} catch {
  Order = mongoose.model<IOrder>("Order", OrderSchema);
}

export default Order;
