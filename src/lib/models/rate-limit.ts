import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRateLimit extends Document<string> {
  _id: string;
  count: number;
  expiresAt: Date;
}

/**
 * Fixed-window counters, mirrored out of process memory so a restart, deploy
 * or cold start does not hand an attacker a brand new budget.
 *
 * `_id` is `sha256(bucket:key)` — the key is usually an email address, which
 * has no business sitting in a collection in clear text. The TTL index expires
 * rows as soon as their window closes, so the collection stays bounded.
 */
const RateLimitSchema = new Schema<IRateLimit>(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false }
);

RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

let RateLimit: Model<IRateLimit>;

try {
  RateLimit = mongoose.model<IRateLimit>("RateLimit");
} catch {
  RateLimit = mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
}

export default RateLimit;
