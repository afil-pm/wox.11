import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "CUSTOMER" | "ADMIN";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  recoveryCode: string;
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
    role: { type: String, enum: ["CUSTOMER", "ADMIN"], default: "CUSTOMER" },
    recoveryCode: { type: String, default: "" },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

let User: Model<IUser>;

try {
  User = mongoose.model<IUser>("User");
} catch {
  User = mongoose.model<IUser>("User", UserSchema);
}

export default User;
