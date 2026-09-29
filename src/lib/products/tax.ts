const TAX_CATEGORIES = ["apparel", "electronics", "food", "services", "other"];

export interface ProductTaxInput {
  hsnCode: string;
  gstRate: number;
  taxCategory: string;
  taxInclusive: boolean;
}

export const DEFAULT_PRODUCT_TAX: ProductTaxInput = {
  hsnCode: "6211",
  gstRate: 5,
  taxCategory: "apparel",
  taxInclusive: true,
};

/**
 * Clamps a payload tax block into the stored shape. Anything missing or out of
 * range falls back to the defaults so a client can never persist a tax
 * category the checkout does not understand or a GST rate outside 0–100.
 */
export function sanitizeProductTax(
  input: unknown,
  fallback: ProductTaxInput = DEFAULT_PRODUCT_TAX
): ProductTaxInput {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const gstRate = Number(raw.gstRate);
  const hsnCode = typeof raw.hsnCode === "string" ? raw.hsnCode.trim() : "";
  return {
    hsnCode: hsnCode ? hsnCode.slice(0, 20) : fallback.hsnCode,
    gstRate: Number.isFinite(gstRate) ? Math.min(100, Math.max(0, gstRate)) : fallback.gstRate,
    taxCategory:
      typeof raw.taxCategory === "string" && TAX_CATEGORIES.includes(raw.taxCategory)
        ? raw.taxCategory
        : fallback.taxCategory,
    taxInclusive:
      typeof raw.taxInclusive === "boolean" ? raw.taxInclusive : fallback.taxInclusive,
  };
}

/** Rating/review counts the same way: always a number inside its range. */
export function sanitizeRating(input: unknown): number {
  const value = Number(input);
  if (!Number.isFinite(value)) return 0;
  return Math.min(5, Math.max(0, Math.round(value * 10) / 10));
}

export function sanitizeReviewCount(input: unknown): number {
  const value = Number(input);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}
