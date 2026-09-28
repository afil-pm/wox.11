import type { IProductImage, IProductSpec } from "@/lib/models/product";

/** Per-colour copy is optional: empty means "use the product level value". */
export const VARIANT_TITLE_MAX = 160;
export const VARIANT_DESCRIPTION_MAX = 4000;
const SPEC_LABEL_MAX = 80;
const SPEC_VALUE_MAX = 400;
const COLOR_MAX = 60;
const COLOR_CODE_MAX = 20;
const MAX_VARIANT_IMAGES = 12;

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/** Images keep their order (`position` is rewritten to the array index). */
export function normalizeVariantImages(
  images: unknown,
  fallbackAlt: string
): IProductImage[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter(
      (img): img is { url: string; alt?: string } =>
        !!img && typeof img.url === "string" && img.url.trim().length > 0
    )
    .slice(0, MAX_VARIANT_IMAGES)
    .map((img, i) => ({
      url: img.url.trim(),
      alt: text(img.alt, 200) || fallbackAlt || "",
      position: i,
    }));
}

export function normalizeSpecifications(input: unknown): IProductSpec[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => ({
      label: text((entry as { label?: unknown })?.label, SPEC_LABEL_MAX),
      value: text((entry as { value?: unknown })?.value, SPEC_VALUE_MAX),
    }))
    .filter((entry) => entry.label && entry.value);
}

export interface RawVariantInput {
  name?: unknown;
  color?: unknown;
  colorCode?: unknown;
  images?: unknown;
  title?: unknown;
  description?: unknown;
  specifications?: unknown;
}

/**
 * Single place where every product write route (admin/supplier, create/update)
 * turns request JSON into a stored variant, so the colour specific fields can
 * never be stripped by one of the four normalizers.
 */
export function normalizeVariant(
  input: RawVariantInput | null | undefined,
  fallbackAlt: string
) {
  const raw = input ?? {};
  return {
    name: (typeof raw.name === "string" && raw.name.trim()) || "Default",
    color: text(raw.color, COLOR_MAX),
    colorCode: text(raw.colorCode, COLOR_CODE_MAX),
    title: text(raw.title, VARIANT_TITLE_MAX),
    description: text(raw.description, VARIANT_DESCRIPTION_MAX),
    images: normalizeVariantImages(raw.images, fallbackAlt),
    specifications: normalizeSpecifications(raw.specifications),
  };
}
