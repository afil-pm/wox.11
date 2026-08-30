import { NextRequest, NextResponse } from "next/server";
import { generateProductSlug } from "@/lib/seo";

function isAdmin(req: NextRequest): boolean {
  const adminHeader = req.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "200", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    const { default: Category } = await import("@/lib/models/category");
    await connectMongoDB();

    const filter: Record<string, unknown> = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { sku: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const catIds = [...new Set((products as unknown as Record<string, unknown>[]).map((p) => String(p.categoryId)).filter(Boolean))];
    const cats = catIds.length > 0 ? await Category.find({ _id: { $in: catIds } }).lean() : [];
    const catMap: Record<string, { name: string; slug: string; gender: string; type: string }> = {};
    for (const c of (cats as unknown as Record<string, unknown>[])) {
      catMap[String(c._id)] = { name: c.name as string, slug: c.slug as string, gender: c.gender as string, type: c.type as string };
    }

    const formatted = products.map((p) => {
      const obj = p as unknown as { _id: string; name: string; slug: string; description: string; basePrice: number; salePrice: number; sku: string; categoryId: unknown; store: string; images: unknown; variants: unknown; isFeatured: boolean; isActive: boolean; averageRating: number; reviewCount: number; seo: unknown; createdAt: unknown };
      const cat = obj.categoryId ? catMap[String(obj.categoryId)] : null;
      return {
        id: String(obj._id),
        name: obj.name,
        slug: obj.slug,
        description: obj.description ?? "",
        basePrice: obj.basePrice,
        salePrice: obj.salePrice ?? 0,
        sku: obj.sku,
        store: obj.store ?? "",
        category: cat ?? { name: "Uncategorized", slug: "uncategorized", gender: "men", type: "shirts" },
        categoryId: obj.categoryId ? String(obj.categoryId) : null,
        images: (obj.images ?? []) as { url: string; alt: string; position: number }[],
        variants: (obj.variants ?? []) as { name: string; color: string; colorCode: string; sizes: { name: string; quantity: number }[] }[],
        isFeatured: obj.isFeatured ?? false,
        isActive: obj.isActive ?? true,
        averageRating: obj.averageRating ?? 0,
        reviewCount: obj.reviewCount ?? 0,
        seo: obj.seo || {},
        source: "mongo" as const,
        createdAt: String(obj.createdAt ?? new Date().toISOString()),
      };
    });

    return NextResponse.json({ products: formatted, total: formatted.length });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json(
      { products: [], total: 0, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized — admin access required" }, { status: 401 });
    }

    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    const { default: Category } = await import("@/lib/models/category");
    await connectMongoDB();
    const body = await request.json();

    const { name, description, basePrice, salePrice, sku, categoryId, store, isFeatured, isActive, images, variants, seo: adminSeo, tax } = body;

    if (!name || !basePrice || !sku || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
      return NextResponse.json({ error: `Category not found for ID: ${categoryId}` }, { status: 404 });
    }

    let slug = generateProductSlug(name);

    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingSku) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }

    const productImages = Array.isArray(images)
      ? images.map((img: { url: string; alt?: string; position?: number }, i: number) => ({
          url: img.url,
          alt: img.alt || name,
          position: img.position ?? i,
        }))
      : [];

    const productVariants = Array.isArray(variants)
      ? variants.map((v: { name: string; color?: string; colorCode?: string; sizes?: { name: string; quantity: number }[] }) => ({
          name: v.name || "Default",
          color: v.color || "",
          colorCode: v.colorCode || "",
          sizes: Array.isArray(v.sizes) ? v.sizes.map((s) => ({ name: s.name, quantity: s.quantity || 0 })) : [],
        }))
      : [];

    const price = salePrice ? Number(salePrice) : Number(basePrice);
    const autoSeo = {
      metaTitle: adminSeo?.metaTitle || `${name} | Buy Online at WOX.11`,
      metaDescription: adminSeo?.metaDescription || `${(description || `Shop ${name} at WOX.11`).replace(/<[^>]*>/g, "").slice(0, 155)}. Starting at ₹${price}.`,
      keywords: adminSeo?.keywords?.length ? adminSeo.keywords : [name.toLowerCase(), existingCategory.name.toLowerCase(), existingCategory.gender, "wox11", "fashion"],
      ogTitle: adminSeo?.ogTitle || `${name} | WOX.11`,
      ogDescription: adminSeo?.ogDescription || `${(description || `Shop ${name} at WOX.11`).replace(/<[^>]*>/g, "").slice(0, 200)}`,
      ogImage: adminSeo?.ogImage || productImages[0]?.url || "",
      canonicalUrl: adminSeo?.canonicalUrl || "",
      noindex: adminSeo?.noindex || false,
      slugHistory: [] as string[],
    };

    const product = await Product.create({
      name,
      slug,
      description: description || "",
      basePrice: Number(basePrice),
      salePrice: salePrice ? Number(salePrice) : 0,
      sku: sku.toUpperCase(),
      categoryId,
      store: store || "",
      isFeatured: isFeatured || false,
      isActive: isActive !== false,
      images: productImages,
      variants: productVariants,
      seo: autoSeo,
      tax: tax || { hsnCode: "6211", gstRate: 5, taxCategory: "apparel", taxInclusive: true },
    });

    const { default: Notification } = await import("@/lib/models/notification");
    Notification.create({
      userId: "all",
      title: "New Product",
      body: `New product "${name}" has been added to the store. Check it out!`,
      type: "new_product",
    }).catch(() => {});

    const { sendPushToAll } = await import("@/lib/push");
    sendPushToAll({
      title: "New Product",
      body: `New product "${name}" has been added to the store. Check it out!`,
      url: `/`,
      tag: `new-product-${product.slug}`,
    }).catch(() => {});

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized — admin access required" }, { status: 401 });
    }

    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    await connectMongoDB();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (data.name && data.name !== existingProduct.name) {
      const newSlug = generateProductSlug(data.name);
      if (newSlug !== existingProduct.slug) {
        const slugHistory = [...(existingProduct.seo?.slugHistory || []), existingProduct.slug];
        data.slug = newSlug;
        if (!data.seo) data.seo = {};
        data.seo.slugHistory = slugHistory;
      }
    }

    if (data.sku && data.sku !== existingProduct.sku) {
      const existingSku = await Product.findOne({ sku: data.sku });
      if (existingSku) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
      }
    }

    if (data.images && Array.isArray(data.images)) {
      data.images = data.images.map((img: { url: string; alt?: string; position?: number }, i: number) => ({
        url: img.url,
        alt: img.alt || "",
        position: img.position ?? i,
      }));
    }

    if (data.variants && Array.isArray(data.variants)) {
      data.variants = data.variants.map((v: { name: string; color?: string; colorCode?: string; sizes?: { name: string; quantity: number }[] }) => ({
        name: v.name || "Default",
        color: v.color || "",
        colorCode: v.colorCode || "",
        sizes: Array.isArray(v.sizes) ? v.sizes.map((s) => ({ name: s.name, quantity: s.quantity || 0 })) : [],
      }));
    }

    if (data.seo && typeof data.seo === "object") {
      const existingSeo = existingProduct.seo || {};
      data.seo = {
        metaTitle: data.seo.metaTitle !== undefined ? data.seo.metaTitle : existingSeo.metaTitle || "",
        metaDescription: data.seo.metaDescription !== undefined ? data.seo.metaDescription : existingSeo.metaDescription || "",
        keywords: data.seo.keywords !== undefined ? data.seo.keywords : existingSeo.keywords || [],
        ogTitle: data.seo.ogTitle !== undefined ? data.seo.ogTitle : existingSeo.ogTitle || "",
        ogDescription: data.seo.ogDescription !== undefined ? data.seo.ogDescription : existingSeo.ogDescription || "",
        ogImage: data.seo.ogImage !== undefined ? data.seo.ogImage : existingSeo.ogImage || "",
        canonicalUrl: data.seo.canonicalUrl !== undefined ? data.seo.canonicalUrl : existingSeo.canonicalUrl || "",
        noindex: data.seo.noindex !== undefined ? data.seo.noindex : existingSeo.noindex || false,
        slugHistory: data.seo.slugHistory || existingSeo.slugHistory || [],
      };
    }

    const product = await Product.findByIdAndUpdate(id, {
      ...data,
      salePrice: data.salePrice !== undefined && data.salePrice !== null && data.salePrice !== "" ? Number(data.salePrice) : 0,
    }, { new: true })
      .populate("categoryId", "name slug gender type");

    return NextResponse.json({ product });
  } catch (error) {
    console.error("PUT /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized — admin access required" }, { status: 401 });
    }

    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized — admin access required" }, { status: 401 });
    }

    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    await connectMongoDB();
    const body = await request.json();
    const { productIds, discountType, discountValue } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "productIds array is required" }, { status: 400 });
    }

    if (!discountType || !["percent", "flat"].includes(discountType)) {
      return NextResponse.json({ error: "discountType must be 'percent' or 'flat'" }, { status: 400 });
    }

    if (typeof discountValue !== "number" || discountValue <= 0) {
      return NextResponse.json({ error: "discountValue must be a positive number" }, { status: 400 });
    }

    const products = await Product.find({ _id: { $in: productIds } }).lean();
    if (products.length === 0) {
      return NextResponse.json({ error: "No matching products found" }, { status: 404 });
    }

    const ops = products.map((p) => {
      const basePrice = Number(p.basePrice);
      let newSalePrice: number;
      if (discountType === "percent") {
        newSalePrice = Math.round(basePrice * (1 - discountValue / 100));
      } else {
        newSalePrice = Math.max(1, basePrice - discountValue);
      }
      return {
        updateOne: {
          filter: { _id: p._id },
          update: { salePrice: newSalePrice },
        },
      };
    });

    await Product.bulkWrite(ops);

    return NextResponse.json({
      message: `Updated ${products.length} product(s)`,
      count: products.length,
    });
  } catch (error) {
    console.error("PATCH /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to apply discount" }, { status: 500 });
  }
}
