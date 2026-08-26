import { NextRequest, NextResponse } from "next/server";

const defaultCategories = [
  { id: "cat-men-shirts", name: "Shirts", slug: "shirts", gender: "men", type: "shirts" },
  { id: "cat-men-tshirts", name: "T-Shirts", slug: "t-shirts", gender: "men", type: "t-shirts" },
  { id: "cat-men-pants", name: "Pants", slug: "pants", gender: "men", type: "pants" },
  { id: "cat-boys-shirts", name: "Shirts", slug: "shirts", gender: "boys", type: "shirts" },
  { id: "cat-boys-tshirts", name: "T-Shirts", slug: "t-shirts", gender: "boys", type: "t-shirts" },
  { id: "cat-boys-pants", name: "Pants", slug: "pants", gender: "boys", type: "pants" },
];

async function getMongoCategories() {
  try {
    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Category } = await import("@/lib/models/category");
    await connectMongoDB();
    const categories = await Category.find().sort({ name: 1 }).lean();
    return categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      gender: c.gender,
      type: c.type,
    }));
  } catch (error) {
    console.error("Failed to fetch MongoDB categories:", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const mongoCategories = await getMongoCategories();
    const allCategories = mongoCategories.length > 0 ? mongoCategories : defaultCategories;
    return NextResponse.json({ categories: allCategories });
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json({ categories: defaultCategories });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Category } = await import("@/lib/models/category");
    await connectMongoDB();
    const body = await request.json();
    const { name, slug, gender, type } = body;

    if (!name || !slug || !gender || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "Category slug already exists" }, { status: 400 });
    }

    const category = await Category.create({ name, slug, gender, type });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/categories error:", error);
    const message = error instanceof Error ? error.message : "Failed to create category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
