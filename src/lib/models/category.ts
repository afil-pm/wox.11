import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  gender: "men" | "boys";
  type: "shirts" | "t-shirts" | "pants";
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    gender: { type: String, enum: ["men", "boys"], required: true },
    type: { type: String, enum: ["shirts", "t-shirts", "pants"], required: true },
  },
  { timestamps: true }
);

CategorySchema.index({ slug: 1, gender: 1 }, { unique: true });

let Category: Model<ICategory>;

try {
  Category = mongoose.model<ICategory>("Category");
} catch {
  Category = mongoose.model<ICategory>("Category", CategorySchema);
}

export default Category;
