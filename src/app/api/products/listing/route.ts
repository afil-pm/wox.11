import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender");
    const category = searchParams.get("category");

    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    const { default: Category } = await import("@/lib/models/category");
    await connectMongoDB();

    const catFilter: Record<string, string> = {};
    if (gender) catFilter.gender = gender;
    if (category) catFilter.type = category.toLowerCase();

    const mongoCats = await Category.find(catFilter).lean();
    const catIds = mongoCats.map((c: { _id: { toString(): string } }) => c._id.toString());
    const catMap: Record<string, { name: string; gender: string }> = {};
    for (const c of mongoCats) {
      catMap[c._id.toString()] = { name: c.name, gender: c.gender };
    }

    const rawDocs = catIds.length > 0
      ? await Product.find({ categoryId: { $in: catIds }, isActive: true }).lean()
      : [];

    const mongoProducts = (rawDocs as unknown as Record<string, unknown>[]).map((p) => {
      const cat = catMap[p.categoryId as string] || { name: "", gender: "" };
      const images = Array.isArray(p.images) ? p.images : [];
      return {
        id: String(p._id),
        name: p.name as string,
        slug: p.slug as string,
        basePrice: p.basePrice as number,
        salePrice: (p.salePrice as number) || 0,
        averageRating: (p.averageRating as number) || 0,
        reviewCount: (p.reviewCount as number) || 0,
        images: images.map((img: { url: string; alt: string }) => ({ url: img.url, alt: img.alt })),
        category: cat,
        source: "mongo" as const,
      };
    });

    return NextResponse.json({ products: mongoProducts, total: mongoProducts.length });
  } catch (error) {
    console.error("Products listing error:", error);
    return NextResponse.json({ products: [], total: 0 }, { status: 500 });
  }
}
