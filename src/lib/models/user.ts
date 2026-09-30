import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "CUSTOMER" | "ADMIN" | "SUPPLIER";
export type SupplierStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
/**
 * Server-side supplier verification state. Independent from `role` (the
 * account stays a SUPPLIER account) and from `supplierStatus` (suspension).
 */
export type VerificationStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  recoveryCode: string;
  /** Supplier profile — only meaningful when role === "SUPPLIER". */
  supplierName: string;
  /**
   * Only set for accounts created after the verification flow shipped (the
   * register route writes it explicitly). Accounts created before have no
   * value at all — intentionally no schema default, because mongoose would
   * fill that default on read and silently lock every existing supplier out
   * of the panel. Missing value falls back to the supplierStatus based rule
   * in `effectiveVerificationStatus()`.
   */
  verificationStatus?: VerificationStatus;
  supplierStatus: SupplierStatus;
  supplierPermissions: {
    canUpdateOrderStatus: boolean;
  };
  supplierApprovedAt?: Date;
  supplierRejectedAt?: Date;
  /**
   * Bumped whenever credentials change (password reset today). Session tokens
   * carry the value they were issued under, so a bump signs every existing
   * session out at once — see `lib/auth/session-revocation.ts`.
   */
  sessionVersion: number;
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
    verificationStatus: {
      type: String,
      enum: ["PENDING_VERIFICATION", "VERIFIED", "REJECTED"],
    },
    supplierStatus: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED"],
      default: "PENDING",
    },
    supplierPermissions: {
      canUpdateOrderStatus: { type: Boolean, default: false },
    },
    supplierApprovedAt: { type: Date },
    supplierRejectedAt: { type: Date },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, verificationStatus: 1, supplierStatus: 1 });

let User: Model<IUser>;

try {
  User = mongoose.model<IUser>("User");
} catch {
  User = mongoose.model<IUser>("User", UserSchema);
}

export default User;
