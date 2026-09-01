import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Review from "@/lib/models/review";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await connectMongoDB();
    const mongoProduct = await Product.findOne({ slug, isActive: true })
      .populate("categoryId", "name slug gender type");

    if (mongoProduct) {
      const p = mongoProduct.toObject();
      const cat = p.categoryId as unknown as { name: string; slug: string; gender: string } | null;

      const reviews = await Review.find({ productId: p._id })
        .sort({ createdAt: -1 })
        .lean() as unknown as { _id: string; rating: number; comment: string; createdAt: string; userName: string }[];

      const avgFromReviews = reviews.length > 0
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
        averageRating: reviews.length > 0 ? Math.round(avgFromReviews * 10) / 10 : (p.averageRating as number) || 0,
        reviewCount: reviews.length > 0 ? reviews.length : (p.reviewCount as number) || 0,
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
        reviews: formattedReviews,
        specifications: (p.specifications ?? []) as { label: string; value: string }[],
      };

      return NextResponse.json({ product }, { status: 200 });
    }

    const { products: staticProducts } = await import("@/lib/data/products");
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

    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
