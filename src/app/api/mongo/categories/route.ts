import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Category from "@/lib/models/category";

const DEFAULT_CATEGORIES = [
  { name: "Men's Shirts", slug: "men-shirts", gender: "men", type: "shirts" },
  { name: "Men's T-Shirts", slug: "men-t-shirts", gender: "men", type: "t-shirts" },
  { name: "Men's Pants", slug: "men-pants", gender: "men", type: "pants" },
  { name: "Boys' Shirts", slug: "boys-shirts", gender: "boys", type: "shirts" },
  { name: "Boys' T-Shirts", slug: "boys-t-shirts", gender: "boys", type: "t-shirts" },
  { name: "Boys' Pants", slug: "boys-pants", gender: "boys", type: "pants" },
];

export async function GET() {
  try {
    await connectMongoDB();

    let categories = await Category.find().sort({ name: 1 }).lean();

    // Seed default categories if empty
    if (categories.length === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      categories = await Category.find().sort({ name: 1 }).lean();
    }

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("GET /api/mongo/categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
