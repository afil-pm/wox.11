import Product from "@/lib/models/product";
import { notifySupplierOutOfStock } from "@/lib/supplier/notify-suppliers";

export interface StockAdjustItem {
  slug?: string;
  size: string;
  /** Variant colour chosen at checkout; "" or undefined = colour not tracked. */
  color?: string | null;
  quantity: number;
}

type RawVariant = {
  name?: string;
  color?: string;
  sizes?: { name: string; quantity: number }[];
};

type RawProduct = {
  slug?: string;
  name?: string;
  supplierId?: string;
  variants?: RawVariant[];
};

/**
 * Picks the variant an order line refers to. A colour that no longer matches
 * (renamed variant) falls back to the size match so stock is never lost.
 */
function resolveVariantName(variants: RawVariant[], size: string, color?: string | null): string | null {
  const withSize = (variants || []).filter((v) =>
    v.sizes?.some((s) => s.name === size)
  );
  if (withSize.length === 0) return null;
  if (color) {
    const exact = withSize.find((v) => v.name === color || v.color === color);
    if (exact) return exact.name || color;
  }
  return withSize[0].name || color || "";
}

/**
 * Adds `delta * quantity` to the stock of exactly one variant/size.
 * `requireAvailable` only succeeds when the current quantity covers the
 * change (used when deducting). Returns false when nothing was updated.
 */
export async function adjustStock(
  item: StockAdjustItem,
  delta: number,
  opts: { requireAvailable?: boolean } = {}
): Promise<boolean> {
  if (!item.slug) return false;

  try {
    const product = (await Product.findOne({ slug: item.slug }).lean()) as RawProduct | null;
    if (!product) return false;

    const variantName = resolveVariantName(product.variants || [], item.size, item.color);
    if (variantName === null) return false;

    const sizeFilter: Record<string, unknown> = { "s.name": item.size };
    if (opts.requireAvailable) {
      sizeFilter["s.quantity"] = { $gte: item.quantity };
    }

    const res = await Product.updateOne(
      { slug: item.slug },
      { $inc: { "variants.$[v].sizes.$[s].quantity": delta * item.quantity } },
      {
        arrayFilters: [{ "v.name": variantName }, sizeFilter],
      }
    );
    const updated = (res.modifiedCount ?? 0) > 0;
    if (!updated) return false;

    // The last unit just left the shelf: the supplier is told about it (deduped
    // per product per day), which is what the out-of-stock card reports on.
    if (delta < 0) {
      const remaining = (product.variants || []).reduce(
        (sum, variant) =>
          sum + (variant.sizes || []).reduce((s, size) => s + (size.quantity || 0), 0),
        0
      ) - item.quantity;
      if (remaining <= 0) {
        await notifySupplierOutOfStock({
          slug: String(product.slug || item.slug),
          name: product.name,
          supplierId: product.supplierId,
        });
      }
    }

    return true;
  } catch {
    return false;
  }
}
