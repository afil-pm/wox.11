import mongoose, { Schema, Document, Model } from "mongoose";
import type { SpecFieldType } from "@/lib/specs/types";

export interface ISpecField {
  key: string;
  label: string;
  type: SpecFieldType;
  options: string[];
  allowCustom: boolean;
  required: boolean;
  placeholder: string;
}

export interface ISpecTemplate extends Document {
  /** Category type this template applies to (e.g. "pants", "shirts", "shoes"). */
  categoryType: string;
  name: string;
  fields: ISpecField[];
  createdAt: Date;
  updatedAt: Date;
}

const SpecFieldSchema = new Schema<ISpecField>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "select", "multiselect", "number", "boolean"],
      default: "text",
    },
    options: { type: [String], default: [] },
    allowCustom: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
  },
  { _id: false }
);

const SpecTemplateSchema = new Schema<ISpecTemplate>(
  {
    categoryType: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    fields: { type: [SpecFieldSchema], default: [] },
  },
  { timestamps: true }
);

SpecTemplateSchema.index({ categoryType: 1 }, { unique: true });

let SpecTemplate: Model<ISpecTemplate>;

try {
  SpecTemplate = mongoose.model<ISpecTemplate>("SpecTemplate");
} catch {
  SpecTemplate = mongoose.model<ISpecTemplate>("SpecTemplate", SpecTemplateSchema);
}

export default SpecTemplate;
