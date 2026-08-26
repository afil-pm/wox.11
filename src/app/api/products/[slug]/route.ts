import { NextRequest, NextResponse } from "next/server";
import { products } from "@/lib/data/products";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const found = products.find((p) => p.slug === slug);

    if (!found) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

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
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
