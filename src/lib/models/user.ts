import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "CUSTOMER" | "ADMIN" | "SUPPLIER";
export type SupplierStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  recoveryCode: string;
  /** Supplier profile — only meaningful when role === "SUPPLIER". */
  supplierName: string;
  supplierStatus: SupplierStatus;
  supplierPermissions: {
    canUpdateOrderStatus: boolean;
  };
  supplierApprovedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: null },
    role: { type: String, enum: ["CUSTOMER", "ADMIN", "SUPPLIER"], default: "CUSTOMER" },
    recoveryCode: { type: String, default: "" },
    supplierName: { type: String, default: "" },
    supplierStatus: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED"],
      default: "PENDING",
    },
    supplierPermissions: {
      canUpdateOrderStatus: { type: Boolean, default: false },
    },
    supplierApprovedAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, supplierStatus: 1 });

let User: Model<IUser>;

try {
  User = mongoose.model<IUser>("User");
} catch {
  User = mongoose.model<IUser>("User", UserSchema);
}

export default User;
