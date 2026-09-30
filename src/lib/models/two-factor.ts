import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Second-factor state, keyed by session subject rather than by a user row so
 * the environment-backed admin account (`admin-env`), which has no user
 * document, can enrol too.
 *
 * The shared secret sits in the same database as the rest of the application;
 * it protects against password theft, not against full database read access —
 * that boundary is the same one `password` (bcrypt) already draws.
 */
export interface ITwoFactor extends Document<string> {
  _id: string;
  /** Session subject: a 24-hex user id or `admin-env`. */
  subject: string;
  /** base32 TOTP secret. */
  secret: string;
  enabled: boolean;
  /** sha256 digests of unused backup codes. */
  backupCodes: string[];
  /** Challenge ids already answered, so a challenge is single use. */
  usedChallenges: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TwoFactorSchema = new Schema<ITwoFactor>(
  {
    _id: { type: String, required: true },
    subject: { type: String, required: true },
    secret: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    backupCodes: { type: [String], default: [] },
    usedChallenges: { type: [String], default: [] },
  },
  { timestamps: true, collection: "twofactors" }
);

let TwoFactor: Model<ITwoFactor>;

try {
  TwoFactor = mongoose.model<ITwoFactor>("TwoFactor");
} catch {
  TwoFactor = mongoose.model<ITwoFactor>("TwoFactor", TwoFactorSchema);
}

export default TwoFactor;
