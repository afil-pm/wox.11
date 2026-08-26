import { NextResponse } from "next/server";
import { products as staticProducts } from "@/lib/data/products";

export async function POST() {
  try {
    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    const { default: Category } = await import("@/lib/models/category");
    await connectMongoDB();

    try {
      await Category.collection.dropIndex("slug_1");
    } catch {
      // Index may not exist
    }

    const categoryMap: Record<string, string> = {};

    const categoriesToCreate = [
      { name: "Shirts", slug: "shirts", gender: "men" as const, type: "shirts" as const },
      { name: "T-Shirts", slug: "t-shirts", gender: "men" as const, type: "t-shirts" as const },
      { name: "Pants", slug: "pants", gender: "men" as const, type: "pants" as const },
      { name: "Shirts", slug: "shirts", gender: "boys" as const, type: "shirts" as const },
      { name: "T-Shirts", slug: "t-shirts", gender: "boys" as const, type: "t-shirts" as const },
      { name: "Pants", slug: "pants", gender: "boys" as const, type: "pants" as const },
    ];

    for (const cat of categoriesToCreate) {
      const key = `${cat.gender}-${cat.slug}`;
      let existing = await Category.findOne({ slug: cat.slug, gender: cat.gender });
      if (!existing) {
        existing = await Category.create(cat);
      }
      categoryMap[key] = String(existing._id);
    }

    let created = 0;
    let skipped = 0;

    for (const p of staticProducts) {
      const existing = await Product.findOne({ slug: p.slug });
      if (existing) {
        skipped++;
        continue;
      }

      const catKey = `${p.category.gender}-${p.category.name.toLowerCase().replace(/\s+/g, "-")}`;
      const categoryId = categoryMap[catKey];

      if (!categoryId) {
        skipped++;
        continue;
      }

      await Product.create({
        name: p.name,
        slug: p.slug,
        description: `${p.name} - Premium quality from WOX.11. Made with the finest materials for lasting comfort and style.`,
        basePrice: p.basePrice,
        salePrice: p.salePrice ?? 0,
        sku: `WOX-${p.id.toUpperCase()}`,
        categoryId,
        images: p.images.map((img) => ({ url: img.url, alt: img.alt, position: 0 })),
        variants: [
          {
            name: "Default",
            color: p.category.name.toLowerCase(),
            colorCode: undefined,
            sizes: [
              { name: "S", quantity: 10 },
              { name: "M", quantity: 15 },
              { name: "L", quantity: 12 },
              { name: "XL", quantity: 8 },
              { name: "XXL", quantity: 5 },
            ],
          },
        ],
        isFeatured: p.averageRating >= 4.6,
        isActive: true,
      });
      created++;
    }

    return NextResponse.json({
      message: `Seed complete: ${created} products created, ${skipped} skipped (already exist)`,
      created,
      skipped,
      categories: Object.keys(categoryMap).length,
    });
  } catch (error) {
    console.error("Seed error:", error);
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
