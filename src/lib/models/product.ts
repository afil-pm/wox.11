import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductImage {
  url: string;
  alt: string;
  position: number;
}

export interface IProductSize {
  name: string;
  quantity: number;
}

export interface IProductVariant {
  name: string;
  color: string;
  colorCode: string;
  sizes: IProductSize[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  salePrice: number;
  sku: string;
  categoryId: mongoose.Types.ObjectId;
  store: string;
  images: IProductImage[];
  variants: IProductVariant[];
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    position: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductSizeSchema = new Schema<IProductSize>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true },
    color: { type: String, default: "" },
    colorCode: { type: String, default: "" },
    sizes: { type: [ProductSizeSchema], default: [] },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    basePrice: { type: Number, required: true },
    salePrice: { type: Number, default: 0 },
    sku: { type: String, required: true, unique: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    store: { type: String, default: "" },
    images: { type: [ProductImageSchema], default: [] },
    variants: { type: [ProductVariantSchema], default: [] },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ createdAt: -1 });

let Product: Model<IProduct>;

try {
  Product = mongoose.model<IProduct>("Product");
} catch {
  Product = mongoose.model<IProduct>("Product", ProductSchema);
}

export default Product;
