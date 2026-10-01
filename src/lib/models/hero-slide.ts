import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHeroSlide extends Document {
  /** Headline shown over the slide. */
  title: string;
  /** Supporting line under the headline. */
  subtitle: string;
  /** Primary call to action. */
  ctaLabel: string;
  ctaHref: string;
  /** Optional second call to action. */
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  /** `/images/...` asset or an http(s) URL. */
  image: string;
  imageAlt: string;
  /** Display order, lowest first. */
  order: number;
  active: boolean;
}

const HeroSlideSchema = new Schema<IHeroSlide>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    ctaLabel: { type: String, default: "" },
    ctaHref: { type: String, default: "" },
    secondaryCtaLabel: { type: String, default: "" },
    secondaryCtaHref: { type: String, default: "" },
    image: { type: String, required: true },
    imageAlt: { type: String, default: "" },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

HeroSlideSchema.index({ active: 1, order: 1 });

let HeroSlide: Model<IHeroSlide>;

try {
  HeroSlide = mongoose.model<IHeroSlide>("HeroSlide");
} catch {
  HeroSlide = mongoose.model<IHeroSlide>("HeroSlide", HeroSlideSchema);
}

export default HeroSlide;
