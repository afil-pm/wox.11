import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISlugRedirect extends Document {
  oldSlug: string;
  newSlug: string;
  entityType: "product";
  createdAt: Date;
}

const SlugRedirectSchema = new Schema<ISlugRedirect>(
  {
    oldSlug: { type: String, required: true },
    newSlug: { type: String, required: true },
    entityType: { type: String, default: "product" },
  },
  { timestamps: true }
);

SlugRedirectSchema.index({ oldSlug: 1, entityType: 1 }, { unique: true });

let SlugRedirect: Model<ISlugRedirect>;

try {
  SlugRedirect = mongoose.model<ISlugRedirect>("SlugRedirect");
} catch {
  SlugRedirect = mongoose.model<ISlugRedirect>("SlugRedirect", SlugRedirectSchema);
}

export default SlugRedirect;
