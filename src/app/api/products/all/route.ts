import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "newest";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    const { default: Category } = await import("@/lib/models/category");
    await connectMongoDB();

    const mongoCats = await Category.find({}).lean();
    const catMap: Record<string, { name: string; slug: string; gender: string; type: string }> = {};
    for (const c of mongoCats) {
      catMap[c._id.toString()] = { name: c.name, slug: c.slug, gender: c.gender, type: c.type };
    }

    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price-low") sortQuery = { salePrice: 1, basePrice: 1 };
    else if (sort === "price-high") sortQuery = { salePrice: -1, basePrice: -1 };
    else if (sort === "rating") sortQuery = { averageRating: -1 };
    else if (sort === "popular") sortQuery = { reviewCount: -1 };

    const rawDocs = await Product.find({ isActive: true })
      .sort(sortQuery)
      .limit(limit)
      .lean();

    const products = (rawDocs as unknown as Record<string, unknown>[]).map((p) => {
      const cat = catMap[p.categoryId as string] || { name: "Uncategorized", slug: "uncategorized", gender: "men", type: "shirts" };
      const images = Array.isArray(p.images) ? p.images : [];
      return {
        id: String(p._id),
        name: p.name as string,
        slug: p.slug as string,
        basePrice: p.basePrice as number,
        salePrice: (p.salePrice as number) || 0,
        averageRating: (p.averageRating as number) || 0,
        reviewCount: (p.reviewCount as number) || 0,
        isFeatured: (p.isFeatured as boolean) || false,
        images: images.map((img: { url: string; alt: string }) => ({ url: img.url, alt: img.alt })),
        category: cat,
        source: "mongo" as const,
      };
    });

    return NextResponse.json({ products, total: products.length });
  } catch (error) {
    console.error("Products all error:", error);
    return NextResponse.json({ products: [], total: 0 }, { status: 500 });
  }
}
