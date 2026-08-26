import { NextRequest, NextResponse } from "next/server";
import { products as staticProducts } from "@/lib/data/products";
import { connectMongoDB } from "@/lib/mongodb";
import Product from "@/lib/models/product";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const gender = searchParams.get("gender") || "";
    const currentSlug = searchParams.get("exclude") || "";

    const staticRelated = staticProducts
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
      .slice(0, 8)
      .map((p) => {
        const cat = p.categoryId as unknown as { name: string; gender: string } | null;
        return {
          id: String(p._id),
          name: p.name,
          slug: p.slug,
          basePrice: p.basePrice,
          salePrice: p.salePrice || null,
          averageRating: 0,
          reviewCount: 0,
          images: (p.images || []).map((img: { url: string; alt?: string }) => ({ url: img.url, alt: img.alt || "" })),
          category: { name: cat?.name || "Uncategorized", gender: cat?.gender || "men" },
        };
      });

    const related = [...staticRelated, ...mongoRelated].slice(0, 8);

    return NextResponse.json({ products: related });
  } catch (error) {
    console.error("GET /api/products/related error:", error);
    return NextResponse.json({ error: "Failed to fetch related products" }, { status: 500 });
  }
}
