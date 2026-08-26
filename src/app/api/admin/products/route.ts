import { NextRequest, NextResponse } from "next/server";
import { products as staticProducts } from "@/lib/data/products";

function isAdmin(req: NextRequest): boolean {
  const adminHeader = req.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

async function getMongoProducts(search: string, limit: number, skip: number) {
  try {
    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    await connectMongoDB();

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const mongoProducts = await Product.find(filter)
      .populate("categoryId", "name slug gender type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return mongoProducts.map((p) => {
      const obj = p as unknown as { _id: string; name: string; slug: string; description: string; basePrice: number; salePrice: number; sku: string; categoryId: unknown; images: unknown; variants: unknown; isFeatured: boolean; isActive: boolean; createdAt: unknown };
      const cat = obj.categoryId as unknown as { _id: string; name: string; slug: string; gender: string; type: string } | null;
      return {
        id: String(obj._id),
        name: obj.name,
        slug: obj.slug,
        description: obj.description ?? "",
        basePrice: obj.basePrice,
        salePrice: obj.salePrice ?? 0,
        sku: obj.sku,
        category: cat ? { name: cat.name, slug: cat.slug, gender: cat.gender, type: cat.type } : { name: "Uncategorized", slug: "uncategorized", gender: "men", type: "shirts" },
        categoryId: cat ? String(cat._id) : null,
        images: (obj.images ?? []) as { url: string; alt: string; position: number }[],
        variants: (obj.variants ?? []) as { name: string; color: string; colorCode: string; sizes: { name: string; quantity: number }[] }[],
        isFeatured: obj.isFeatured ?? false,
        isActive: obj.isActive ?? true,
        averageRating: 0,
        reviewCount: 0,
        source: "mongo" as const,
        createdAt: String(obj.createdAt ?? new Date().toISOString()),
      };
    });
  } catch (error) {
    console.error("Failed to fetch MongoDB products:", error);
    return [];
  }
}

function normalizeStaticProduct(p: (typeof staticProducts)[number]) {
  const gender = p.category.gender;
  const catSlug = p.category.name.toLowerCase().replace(/\s+/g, "-");
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: "",
    basePrice: p.basePrice,
    salePrice: p.salePrice ?? 0,
    sku: `STATIC-${p.id.toUpperCase()}`,
    category: { name: p.category.name, slug: catSlug, gender, type: catSlug },
    categoryId: null,
    images: p.images.map((img) => ({ url: img.url, alt: img.alt, position: 0 })),
    variants: [
      {
        name: "Default",
        color: p.category.name.toLowerCase(),
        colorCode: null,
        sizes: [
          { name: "S", quantity: 10 },
          { name: "M", quantity: 15 },
          { name: "L", quantity: 12 },
          { name: "XL", quantity: 8 },
          { name: "XXL", quantity: 5 },
        ],
      },
    ],
    isFeatured: false,
    isActive: true,
    averageRating: p.averageRating,
    reviewCount: p.reviewCount,
    source: "static" as const,
    createdAt: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "200", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const allStatic = staticProducts.map(normalizeStaticProduct);
    const allMongo = await getMongoProducts(search, limit, skip);

    let products = [...allStatic, ...allMongo];

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ products, total: products.length });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    const allStatic = staticProducts.map(normalizeStaticProduct);
    return NextResponse.json({ products: allStatic, total: allStatic.length });
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
      return NextResponse.json({ error: "Product not found in database. Static products cannot be edited — create a new product instead." }, { status: 404 });
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
      return NextResponse.json({ error: "Cannot delete static product. Only MongoDB products can be deleted." }, { status: 400 });
    }

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/products error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
