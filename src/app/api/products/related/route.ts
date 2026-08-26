import { NextRequest, NextResponse } from "next/server";
import { products } from "@/lib/data/products";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const gender = searchParams.get("gender") || "";
    const currentSlug = searchParams.get("exclude") || "";

    const related = products
      .filter(
        (p) =>
          p.slug !== currentSlug &&
          p.category.name.toLowerCase() === category.toLowerCase() &&
          p.category.gender.toLowerCase() === gender.toLowerCase()
      )
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        basePrice: p.basePrice,
        salePrice: p.salePrice,
        averageRating: p.averageRating,
        reviewCount: p.reviewCount,
        images: p.images.map((img) => ({ url: img.url, alt: img.alt })),
        category: { name: p.category.name, gender: p.category.gender },
      }));

    return NextResponse.json({ products: related });
  } catch (error) {
    console.error("GET /api/products/related error:", error);
    return NextResponse.json({ error: "Failed to fetch related products" }, { status: 500 });
  }
}
