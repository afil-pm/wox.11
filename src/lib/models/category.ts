import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategorySeo {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage: string;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  gender: "men" | "boys";
  type: "shirts" | "t-shirts" | "pants";
  description: string;
  seo: ICategorySeo;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySeoSchema = new Schema<ICategorySeo>(
  {
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    ogImage: { type: String, default: "" },
  },
  { _id: false }
);

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    gender: { type: String, enum: ["men", "boys"], required: true },
    type: { type: String, enum: ["shirts", "t-shirts", "pants"], required: true },
    description: { type: String, default: "" },
    seo: { type: CategorySeoSchema, default: () => ({}) },
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
