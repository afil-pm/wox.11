import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISeoSetting extends Document {
  /** Singleton key — there is exactly one document, `"site"`. */
  key: string;
  siteTitle: string;
  siteDescription: string;
  /** Public URL/path emitted as og:image. Empty means the built-in default. */
  defaultOgImage: string;
  /** Inline `data:image/...` payload when the image was uploaded, else "". */
  ogImageData: string;
  /** Bumped whenever the image changes — cache-busts `/api/og-image?v=`. */
  ogImageVersion: number;
  /** Probed dimensions of defaultOgImage; 0 means unknown. */
  ogImageWidth: number;
  ogImageHeight: number;
  ogImageAlt: string;
  keywords: string[];
  homepageTitle: string;
  homepageDescription: string;
}

const SeoSettingSchema = new Schema<ISeoSetting>(
  {
    key: { type: String, required: true, unique: true },
    siteTitle: { type: String, default: "" },
    siteDescription: { type: String, default: "" },
    defaultOgImage: { type: String, default: "" },
    ogImageData: { type: String, default: "" },
    ogImageVersion: { type: Number, default: 0 },
    ogImageWidth: { type: Number, default: 0 },
    ogImageHeight: { type: Number, default: 0 },
    ogImageAlt: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    homepageTitle: { type: String, default: "" },
    homepageDescription: { type: String, default: "" },
  },
  { timestamps: true }
);

let SeoSetting: Model<ISeoSetting>;

try {
  SeoSetting = mongoose.model<ISeoSetting>("SeoSetting");
} catch {
  SeoSetting = mongoose.model<ISeoSetting>("SeoSetting", SeoSettingSchema);
}

export default SeoSetting;
