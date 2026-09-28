import { NextRequest, NextResponse } from "next/server";
import type { Types } from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Review from "@/lib/models/review";

export const dynamic = "force-dynamic";

/** Transient database trouble must be retried, never reported as "not found". */
const DB_ATTEMPTS = 3;
const DB_RETRY_DELAY_MS = 250;

function normalizeSlug(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs a read a few times with a short backoff. A single slow Atlas round trip
 * is the difference between a product page loading and a spurious 404.
 */
async function withRetry<T>(read: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= DB_ATTEMPTS; attempt++) {
    try {
      return await read();
    } catch (err) {
      lastError = err;
      if (attempt < DB_ATTEMPTS) await delay(DB_RETRY_DELAY_MS * attempt);
    }
  }
  throw lastError;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const normalizedSlug = normalizeSlug(slug);

    let mongoProduct: Record<string, unknown> | null = null;
    let dbFailed = false;

    try {
      await connectMongoDB();
    } catch (err) {
      // No connection: skip the reads and let the static fallback answer.
      dbFailed = true;
      console.error("[PRODUCT_GET] database connection failed:", err);
    }

    if (normalizedSlug && !dbFailed) {
      try {
        mongoProduct = (await withRetry(() =>
          Product.findOne({ slug: normalizedSlug, isActive: true }).populate(
            "categoryId",
            "name slug gender type"
          )
        )) as unknown as Record<string, unknown> | null;

        if (!mongoProduct) {
          // Products keep their previous slugs when they are renamed, so a
          // bookmarked or shared link keeps working after an edit.
          mongoProduct = (await withRetry(() =>
            Product.findOne({
              "seo.slugHistory": normalizedSlug,
              isActive: true,
            }).populate("categoryId", "name slug gender type")
          )) as unknown as Record<string, unknown> | null;
        }
      } catch (err) {
        dbFailed = true;
        console.error("[PRODUCT_GET] database read failed:", err);
      }
    }

    if (mongoProduct) {
      const p = mongoProduct as {
        _id: Types.ObjectId;
        name: string;
        slug: string;
        description?: string;
        basePrice: number;
        salePrice?: number;
        averageRating?: number;
        reviewCount?: number;
        categoryId?: { name: string; slug: string; gender: string } | null;
        images?: { url: string; alt?: string }[];
        store?: string;
        supplierName?: string;
        variants?: {
          name?: string;
          color?: string;
          colorCode?: string;
          images?: { url: string; alt?: string }[];
          sizes?: { name: string; quantity: number }[];
        }[];
        specifications?: { label: string; value: string }[];
        isActive?: boolean;
      };

      const cat = p.categoryId ?? null;

      // Reviews are decoration: never let a slow review query 404 the product.
      let reviews: {
        _id: string;
        rating: number;
        comment: string;
        createdAt: string;
        userName: string;
      }[] = [];
      try {
        reviews = (await Review.find({ productId: p._id })
          .sort({ createdAt: -1 })
          .lean()) as unknown as typeof reviews;
      } catch (err) {
        console.error("[PRODUCT_GET] reviews read failed:", err);
      }

      const avgFromReviews =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      const formattedReviews = reviews.map((r) => ({
        id: String(r._id),
        rating: r.rating,
        comment: r.comment,
        createdAt: String(r.createdAt),
        user: { name: r.userName },
      }));

      const product = {
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        description: p.description || "",
        basePrice: p.basePrice,
        salePrice: p.salePrice || null,
        averageRating:
          reviews.length > 0
            ? Math.round(avgFromReviews * 10) / 10
            : p.averageRating || 0,
        reviewCount: reviews.length > 0 ? reviews.length : p.reviewCount || 0,
        category: cat
          ? { name: cat.name, slug: cat.slug, gender: cat.gender }
          : { name: "Uncategorized", slug: "uncategorized", gender: "men" },
        images: (p.images || []).map((img: { url: string; alt?: string }) => ({
          url: img.url,
          alt: img.alt || "",
        })),
        store: p.store || "",
        supplierName: p.supplierName || "",
        variants: (p.variants || []).map(
          (
            v: {
              name?: string;
              color?: string;
              colorCode?: string;
              images?: { url: string; alt?: string }[];
              sizes?: { name: string; quantity: number }[];
            },
            vi: number
          ) => ({
            id: String(p._id) + "-v" + vi,
            name: v.name || "Default",
            color: v.color || null,
            colorCode: v.colorCode || null,
            // Colours with their own photos use them; otherwise the product
            // level gallery applies (keeps older products working unchanged).
            images:
              Array.isArray(v.images) && v.images.length > 0
                ? v.images.map((img) => ({ url: img.url, alt: img.alt || "" }))
                : (p.images || []).map((img: { url: string; alt?: string }) => ({
                    url: img.url,
                    alt: img.alt || "",
                  })),
            sizes: (v.sizes || []).map((s) => ({
              id: String(p._id) + "-s" + s.name,
              name: s.name,
              inventory: { quantity: s.quantity ?? 0 },
            })),
          })
        ),
        reviews: formattedReviews,
        specifications: (p.specifications ?? []) as {
          label: string;
          value: string;
        }[],
      };

      return NextResponse.json({ product }, { status: 200 });
    }

    const { products: staticProducts } = await import("@/lib/data/products");
    const found = staticProducts.find((p) => p.slug === normalizedSlug);

    if (found) {
      const product = {
        id: found.id,
        name: found.name,
        slug: found.slug,
        description:
          found.name +
          " - Premium quality from WOX.11. Made with the finest materials for lasting comfort and style.",
        basePrice: found.basePrice,
        salePrice: found.salePrice,
        averageRating: found.averageRating,
        reviewCount: found.reviewCount,
        category: {
          name: found.category.name,
          slug: found.category.name.toLowerCase(),
          gender: found.category.gender,
        },
        images: found.images.map((img) => ({ url: img.url, alt: img.alt })),
        store: "",
        supplierName: "",
        variants: [
          {
            id: found.id + "-default",
            name: "Default",
            color: found.category.name.toLowerCase(),
            colorCode: null,
            images: found.images.map((img) => ({ url: img.url, alt: img.alt })),
            sizes: [
              { id: found.id + "-s", name: "S", inventory: { quantity: 10 } },
              { id: found.id + "-m", name: "M", inventory: { quantity: 15 } },
              { id: found.id + "-l", name: "L", inventory: { quantity: 12 } },
              { id: found.id + "-xl", name: "XL", inventory: { quantity: 8 } },
              { id: found.id + "-xxl", name: "XXL", inventory: { quantity: 5 } },
            ],
          },
        ],
        reviews: [],
      };

      return NextResponse.json({ product }, { status: 200 });
    }

    if (dbFailed) {
      // The product may well exist — tell the client this is temporary
      // instead of lying with a 404 that a reload would turn into
      // "Page Not Found".
      return NextResponse.json(
        { error: "Product lookup temporarily unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return NextResponse.json(
      { error: "Failed to load product" },
      { status: 500 }
    );
  }
}
