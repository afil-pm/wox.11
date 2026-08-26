import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Category from "@/lib/models/category";

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    const categories = await Category.find().sort({ name: 1 }).lean();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
