import { NextRequest, NextResponse } from "next/server";
import { generateProductSlug } from "@/lib/seo";
import { validateProductImageUrl } from "@/lib/images";
import { connectMongoDB } from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Category from "@/lib/models/category";
import { getSupplier } from "@/lib/auth/guards";

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

/**
 * Loads a product only when it belongs to the signed in supplier. Anything
 * else is reported as 404 so other suppliers' product ids leak no information.
 */
async function findOwnedProduct(id: string, supplierId: string) {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) return null;
  const product = await Product.findById(id);
  if (!product || String(product.supplierId || "") !== supplierId) return null;
  return product;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSupplier(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
    }

    await connectMongoDB();
    const { id } = await params;
    const product = await findOwnedProduct(id, auth.supplier.supplierId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        id: String(product._id),
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        basePrice: product.basePrice,
        salePrice: product.salePrice ?? 0,
        sku: product.sku,
        categoryId: product.categoryId ? String(product.categoryId) : null,
        images: product.images ?? [],
        variants: product.variants ?? [],
        isActive: product.isActive ?? true,
        supplierId: product.supplierId ?? "",
        supplierName: product.supplierName ?? "",
      },
    });
  } catch (error) {
    console.error("GET /api/wox/supplier/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSupplier(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
    }

    await connectMongoDB();
    const { id } = await params;
    const existing = await findOwnedProduct(id, auth.supplier.supplierId);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.basePrice !== undefined) data.basePrice = Number(body.basePrice);
    if (body.salePrice !== undefined && body.salePrice !== null && body.salePrice !== "") {
      data.salePrice = Number(body.salePrice);
    } else if (body.salePrice === "" || body.salePrice === null) {
      data.salePrice = 0;
    }
    if (body.isActive !== undefined) data.isActive = body.isActive !== false;
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;

    const nextName = data.name !== undefined ? String(data.name) : existing.name;
    const nextBasePrice = data.basePrice !== undefined ? Number(data.basePrice) : existing.basePrice;
    const nextCategoryId = data.categoryId !== undefined ? data.categoryId : existing.categoryId;
    if (!nextName || !String(nextName).trim() || !nextBasePrice || nextBasePrice <= 0 || !nextCategoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    data.name = nextName;
    data.basePrice = nextBasePrice;
    data.categoryId = nextCategoryId;

    const category = await Category.findById(data.categoryId);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (body.sku !== undefined && body.sku && body.sku !== existing.sku) {
      const duplicate = await Product.findOne({ sku: String(body.sku).toUpperCase() });
      if (duplicate) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
      }
      data.sku = String(body.sku).toUpperCase();
    }

    if (data.name !== existing.name) {
      const newSlug = generateProductSlug(String(data.name));
      if (newSlug !== existing.slug) {
        const slugHistory = [...(existing.seo?.slugHistory || []), existing.slug];
        data.slug = newSlug;
        data.seo = { ...(existing.seo || {}), slugHistory };
      }
    }

    if (Array.isArray(body.images)) {
      const images = body.images.map(
        (img: { url: string; alt?: string; position?: number }, i: number) => ({
          url: img.url,
          alt: img.alt || "",
          position: img.position ?? i,
        })
      );
      const imageError = validateImages(images);
      if (imageError) {
        return NextResponse.json({ error: imageError }, { status: 400 });
      }
      data.images = images;
    }

    if (Array.isArray(body.variants)) {
      const normalizedVariants = body.variants.map(
        (v: { name: string; color?: string; colorCode?: string; images?: { url: string; alt?: string; position?: number }[]; sizes?: { name: string; quantity: number }[] }) => ({
          name: v.name || "Default",
          color: v.color || "",
          colorCode: v.colorCode || "",
          images: Array.isArray(v.images)
            ? v.images
                .filter((img) => img && typeof img.url === "string" && img.url.trim())
                .map((img, i) => ({ url: img.url, alt: img.alt || "", position: i }))
            : [],
          sizes: Array.isArray(v.sizes)
            ? v.sizes.map((s) => ({ name: s.name, quantity: s.quantity || 0 }))
            : [],
        })
      );

      const variantImageError = validateImages(
        normalizedVariants.flatMap(
          (v: { images: { url: string; alt?: string; position?: number }[] }) => v.images
        )
      );
      if (variantImageError) {
        return NextResponse.json({ error: variantImageError }, { status: 400 });
      }

      data.variants = normalizedVariants;
    }

    const product = await Product.findByIdAndUpdate(id, data, { new: true });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("PUT /api/wox/supplier/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSupplier(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
    }

    await connectMongoDB();
    const { id } = await params;
    const product = await findOwnedProduct(id, auth.supplier.supplierId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("DELETE /api/wox/supplier/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
