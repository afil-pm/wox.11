import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Review from "@/lib/models/review";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const gender = searchParams.get("gender") || "";
    const currentSlug = searchParams.get("exclude") || "";

    await connectMongoDB();
    const mongoProducts = await Product.find({ isActive: true })
      .populate("categoryId", "name slug gender type")
      .lean();

    const mongoRelated = mongoProducts
      .filter((p) => {
        const cat = p.categoryId as unknown as { name: string; gender: string } | null;
        return (
          p.slug !== currentSlug &&
          cat &&
          cat.name.toLowerCase() === category.toLowerCase() &&
          cat.gender.toLowerCase() === gender.toLowerCase()
        );
      })
      .slice(0, 8);

    const related = await Promise.all(
      mongoRelated.map(async (p) => {
        const cat = p.categoryId as unknown as { name: string; gender: string } | null;

        const reviews = await Review.find({ productId: p._id }).lean();
        const avgFromReviews = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        return {
          id: String(p._id),
          name: p.name,
          slug: p.slug,
          basePrice: p.basePrice,
          salePrice: p.salePrice || null,
          averageRating: reviews.length > 0 ? Math.round(avgFromReviews * 10) / 10 : (p.averageRating as number) || 0,
          reviewCount: reviews.length > 0 ? reviews.length : (p.reviewCount as number) || 0,
          images: (p.images || []).map((img: { url: string; alt?: string }) => ({ url: img.url, alt: img.alt || "" })),
          category: { name: cat?.name || "Uncategorized", gender: cat?.gender || "men" },
        };
      })
    );

    return NextResponse.json({ products: related });
  } catch (error) {
    console.error("GET /api/products/related error:", error);
    return NextResponse.json({ error: "Failed to fetch related products" }, { status: 500 });
  }
}
