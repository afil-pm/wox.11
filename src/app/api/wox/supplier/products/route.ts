import { NextRequest, NextResponse } from "next/server";
import { generateProductSlug } from "@/lib/seo";
import { validateProductImageUrl } from "@/lib/images";
import { connectMongoDB } from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Category from "@/lib/models/category";
import { getSupplier } from "@/lib/auth/guards";
import { normalizeVariant, normalizeSpecifications, type RawVariantInput } from "@/lib/products/variants";
import { normalizeSpecValues } from "@/lib/specs/normalize";
import { loadSpecTemplate } from "@/lib/specs/service";
import { ensureSupplierStore, loadStoreNames } from "@/lib/stores";
import {
  sanitizeProductTax,
  sanitizeRating,
  sanitizeReviewCount,
} from "@/lib/products/tax";

export const dynamic = "force-dynamic";

function validateImages(images: { url: string; alt?: string; position?: number }[]): string | null {
  for (const [i, img] of images.entries()) {
    const result = validateProductImageUrl(img.url);
    if (!result.ok) {
      return `Invalid image URL at position ${i + 1}: ${result.error}`;
    }
  }
  return null;
}

function stockOf(variants: unknown): number {
  if (!Array.isArray(variants)) return 0;
  return variants.reduce((sum: number, v: { sizes?: { quantity?: number }[] }) => {
    if (!Array.isArray(v?.sizes)) return sum;
    return sum + v.sizes.reduce((s: number, size) => s + (Number(size?.quantity) || 0), 0);
  }, 0);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getSupplier(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
    }

    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10) || 200, 500);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10) || 0, 0);

    const filter: Record<string, unknown> = { supplierId: auth.supplier.supplierId };
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { sku: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    const catIds = [...new Set(products.map((p) => String(p.categoryId)).filter(Boolean))];
    const cats = catIds.length > 0 ? await Category.find({ _id: { $in: catIds } }).lean() : [];
    const catMap = new Map(cats.map((c) => [String(c._id), { name: c.name, slug: c.slug }]));

    const storeMap = await loadStoreNames(products.map((p) => String(p.storeId ?? "")));

    const formatted = products.map((p) => ({
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      basePrice: p.basePrice,
      salePrice: p.salePrice ?? 0,
      sku: p.sku,
      category: catMap.get(String(p.categoryId)) || null,
      categoryId: p.categoryId ? String(p.categoryId) : null,
      // The store name is read from the store record so a rename shows up here
      // without touching the product documents.
      store: storeMap.get(String(p.storeId ?? "")) || p.store || "",
      storeId: p.storeId ?? "",
      supplierId: p.supplierId ?? "",
      images: (p.images ?? []) as { url: string; alt: string; position: number }[],
      variants: (p.variants ?? []) as {
        name: string;
        color: string;
        colorCode: string;
        sizes: { name: string; quantity: number }[];
      }[],
      stock: stockOf(p.variants),
      isActive: p.isActive ?? true,
      isFeatured: p.isFeatured ?? false,
      supplierName: p.supplierName ?? "",
      createdAt: String(p.createdAt ?? new Date().toISOString()),
    }));

    return NextResponse.json({ products: formatted, total });
  } catch (error) {
    console.error("GET /api/wox/supplier/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getSupplier(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
    }

    await connectMongoDB();
    const body = await request.json();
    const {
      name,
      description,
      basePrice,
      salePrice,
      sku,
      categoryId,
      images,
      variants,
      isActive,
      specifications,
      specValues,
      seo: supplierSeo,
      tax,
      averageRating,
      reviewCount,
    } = body;

    // Ownership is never taken from the body: the store always comes from the
    // authenticated supplier account, so a supplier cannot file a product under
    // another supplier's store.
    const store = await ensureSupplierStore(
      auth.supplier.supplierId,
      auth.supplier.supplierName
    );

    if (!name || !basePrice || !sku || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
      return NextResponse.json({ error: `Category not found for ID: ${categoryId}` }, { status: 404 });
    }

    // Suppliers only ever write the fields the admin marked as editable for
    // them; required fields they may edit must be filled in.
    const template = await loadSpecTemplate(existingCategory.type);
    const normalizedSpecs = normalizeSpecValues(specValues, template?.fields ?? [], { role: "supplier" });
    if (normalizedSpecs.errors.length > 0) {
      return NextResponse.json({ error: normalizedSpecs.errors.join("; ") }, { status: 400 });
    }
    const customSpecs = template?.allowSupplierCustom ? normalizeSpecifications(specifications) : [];

    const existingSku = await Product.findOne({ sku: String(sku).toUpperCase() });
    if (existingSku) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }

    let slug = generateProductSlug(name);
    if (await Product.findOne({ slug })) {
      slug = `${slug}-${Date.now()}`;
    }

    const productImages = Array.isArray(images)
      ? images.map(
          (img: { url: string; alt?: string; position?: number }, i: number) => ({
            url: img.url,
            alt: img.alt || name,
            position: img.position ?? i,
          })
        )
      : [];

    const imageError = validateImages(productImages);
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }

    const productVariants = Array.isArray(variants)
      ? variants.map(
          (v: RawVariantInput & { sizes?: { name: string; quantity: number }[] }) => ({
            ...normalizeVariant(v, name),
            sizes: Array.isArray(v.sizes)
              ? v.sizes.map((s) => ({ name: s.name, quantity: s.quantity || 0 }))
              : [],
          })
        )
      : [];

    const variantImageError = validateImages(productVariants.flatMap((v) => v.images));
    if (variantImageError) {
      return NextResponse.json({ error: variantImageError }, { status: 400 });
    }

    const price = salePrice ? Number(salePrice) : Number(basePrice);
    const seo = {
      metaTitle: supplierSeo?.metaTitle || `${name} | Buy Online at WOX.11`,
      metaDescription:
        supplierSeo?.metaDescription ||
        `${(description || `Shop ${name} at WOX.11`).replace(/<[^>]*>/g, "").slice(0, 155)}. Starting at ₹${price}.`,
      keywords: supplierSeo?.keywords?.length
        ? supplierSeo.keywords
        : [name.toLowerCase(), existingCategory.name.toLowerCase(), existingCategory.gender, "wox11", "fashion"],
      ogTitle: supplierSeo?.ogTitle || `${name} | WOX.11`,
      ogDescription:
        supplierSeo?.ogDescription ||
        `${(description || `Shop ${name} at WOX.11`).replace(/<[^>]*>/g, "").slice(0, 200)}`,
      ogImage: supplierSeo?.ogImage || productImages[0]?.url || "",
      canonicalUrl: supplierSeo?.canonicalUrl || "",
      noindex: supplierSeo?.noindex || false,
      slugHistory: [] as string[],
    };

    const product = await Product.create({
      name,
      slug,
      description: description || "",
      basePrice: Number(basePrice),
      salePrice: salePrice ? Number(salePrice) : 0,
      sku: String(sku).toUpperCase(),
      categoryId,
      store: store?.name ?? "",
      storeId: store?.id ?? "",
      supplierId: auth.supplier.supplierId,
      supplierName: auth.supplier.supplierName,
      // Suppliers never self-feature; the admin controls the homepage slots.
      isFeatured: false,
      isActive: isActive !== false,
      averageRating: sanitizeRating(averageRating),
      reviewCount: sanitizeReviewCount(reviewCount),
      images: productImages,
      variants: productVariants,
      seo,
      tax: sanitizeProductTax(tax),
      specifications: customSpecs,
      specValues: normalizedSpecs.specValues,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/wox/supplier/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
