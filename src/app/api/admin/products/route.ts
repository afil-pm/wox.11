import { NextRequest, NextResponse } from "next/server";

function isAdmin(req: NextRequest): boolean {
  const adminHeader = req.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
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
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
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
      const obj = p as unknown as { _id: string; name: string; slug: string; description: string; basePrice: number; salePrice: number; sku: string; categoryId: unknown; images: unknown; variants: unknown; isFeatured: boolean; isActive: boolean; averageRating: number; reviewCount: number; createdAt: unknown };
      const cat = obj.categoryId ? catMap[String(obj.categoryId)] : null;
      return {
        id: String(obj._id),
        name: obj.name,
        slug: obj.slug,
        description: obj.description ?? "",
        basePrice: obj.basePrice,
        salePrice: obj.salePrice ?? 0,
        sku: obj.sku,
        category: cat ?? { name: "Uncategorized", slug: "uncategorized", gender: "men", type: "shirts" },
        categoryId: obj.categoryId ? String(obj.categoryId) : null,
        images: (obj.images ?? []) as { url: string; alt: string; position: number }[],
        variants: (obj.variants ?? []) as { name: string; color: string; colorCode: string; sizes: { name: string; quantity: number }[] }[],
        isFeatured: obj.isFeatured ?? false,
        isActive: obj.isActive ?? true,
        averageRating: obj.averageRating ?? 0,
        reviewCount: obj.reviewCount ?? 0,
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

    const { name, description, basePrice, salePrice, sku, categoryId, isFeatured, isActive, images, variants } = body;

    if (!name || !basePrice || !sku || !categoryId) {
      return NextResponse.json(
        { error: `Missing required fields. Got: name=${!!name}, basePrice=${!!basePrice}, sku=${!!sku}, categoryId=${!!categoryId}` },
        { status: 400 }
      );
    }

    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
      return NextResponse.json({ error: `Category not found for ID: ${categoryId}` }, { status: 404 });
    }

    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingSku) {
      return NextResponse.json({ error: `SKU "${sku.toUpperCase()}" already exists` }, { status: 400 });
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

    const product = await Product.create({
      name,
      slug,
      description: description || "",
      basePrice: Number(basePrice),
      salePrice: salePrice ? Number(salePrice) : 0,
      sku: sku.toUpperCase(),
      categoryId,
      isFeatured: isFeatured || false,
      isActive: isActive !== false,
      images: productImages,
      variants: productVariants,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products error:", error);
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
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
      data.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    if (data.sku && data.sku !== existingProduct.sku) {
      const existingSku = await Product.findOne({ sku: data.sku });
      if (existingSku) {
        return NextResponse.json({ error: `SKU "${data.sku}" already exists` }, { status: 400 });
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

    const product = await Product.findByIdAndUpdate(id, data, { new: true })
      .populate("categoryId", "name slug gender type");

    return NextResponse.json({ product });
  } catch (error) {
    console.error("PUT /api/admin/products error:", error);
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const message = error instanceof Error ? error.message : "Failed to apply discount";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
