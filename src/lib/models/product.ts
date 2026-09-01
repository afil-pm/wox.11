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

export interface IProductSeo {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
  noindex: boolean;
  slugHistory: string[];
}

export interface IProductTax {
  hsnCode: string;
  gstRate: number;
  taxCategory: string;
  taxInclusive: boolean;
}

export interface IProductSpec {
  label: string;
  value: string;
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
  tax: IProductTax;
  specifications: IProductSpec[];
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
  seo: IProductSeo;
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

const ProductSeoSchema = new Schema<IProductSeo>(
  {
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    ogTitle: { type: String, default: "" },
    ogDescription: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    canonicalUrl: { type: String, default: "" },
    noindex: { type: Boolean, default: false },
    slugHistory: { type: [String], default: [] },
  },
  { _id: false }
);

const ProductTaxSchema = new Schema<IProductTax>(
  {
    hsnCode: { type: String, default: "6211" },
    gstRate: { type: Number, default: 5, min: 0, max: 100 },
    taxCategory: { type: String, default: "apparel" },
    taxInclusive: { type: Boolean, default: true },
  },
  { _id: false }
);

const ProductSpecSchema = new Schema<IProductSpec>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
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
    tax: { type: ProductTaxSchema, default: () => ({ hsnCode: "6211", gstRate: 5, taxCategory: "apparel", taxInclusive: true }) },
    specifications: { type: [ProductSpecSchema], default: [] },
    seo: { type: ProductSeoSchema, default: () => ({}) },
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
