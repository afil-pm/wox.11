import { NextRequest, NextResponse } from "next/server";
import { products as staticProducts } from "@/lib/data/products";
import { connectMongoDB } from "@/lib/mongodb";
import Product from "@/lib/models/product";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const found = staticProducts.find((p) => p.slug === slug);

    if (found) {
      const product = {
        id: found.id,
        name: found.name,
        slug: found.slug,
        description: found.name + " - Premium quality from WOX.11. Made with the finest materials for lasting comfort and style.",
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

    await connectMongoDB();
    const mongoProduct = await Product.findOne({ slug, isActive: true })
      .populate("categoryId", "name slug gender type");

    if (!mongoProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const p = mongoProduct.toObject();
    const cat = p.categoryId as unknown as { name: string; slug: string; gender: string } | null;
    const product = {
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      basePrice: p.basePrice,
      salePrice: p.salePrice || null,
      averageRating: 0,
      reviewCount: 0,
      category: cat
        ? { name: cat.name, slug: cat.slug, gender: cat.gender }
        : { name: "Uncategorized", slug: "uncategorized", gender: "men" },
      images: p.images.map((img: { url: string; alt?: string }) => ({
        url: img.url,
        alt: img.alt || "",
      })),
      variants: p.variants.map((v: { name: string; color?: string; colorCode?: string; sizes: { name: string; quantity: number }[] }, vi: number) => ({
        id: String(p._id) + "-v" + vi,
        name: v.name || "Default",
        color: v.color || null,
        colorCode: v.colorCode || null,
        images: p.images.map((img: { url: string; alt?: string }) => ({
          url: img.url,
          alt: img.alt || "",
        })),
        sizes: v.sizes.map((s) => ({
          id: String(p._id) + "-s" + s.name,
          name: s.name,
          inventory: { quantity: s.quantity ?? 0 },
        })),
      })),
      reviews: [],
    };

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
