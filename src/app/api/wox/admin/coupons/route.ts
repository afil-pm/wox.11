import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Coupon from "@/lib/models/coupon";

function isAdmin(request: NextRequest): boolean {
  const adminHeader = request.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("GET /api/admin/coupons error:", error);
    return NextResponse.json({ coupons: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const body = await request.json();
    const { code, discountType, discountValue, applicableProducts, allProducts, minOrderAmount, maxDiscount, usageLimit, active, expiresAt } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      applicableProducts: applicableProducts || [],
      allProducts: allProducts !== false,
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      usageLimit: Number(usageLimit) || 0,
      active: active !== false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });
    }

    if (data.code) data.code = data.code.toUpperCase();
    if (data.discountValue !== undefined) data.discountValue = Number(data.discountValue);
    if (data.minOrderAmount !== undefined) data.minOrderAmount = Number(data.minOrderAmount);
    if (data.maxDiscount !== undefined) data.maxDiscount = Number(data.maxDiscount);
    if (data.usageLimit !== undefined) data.usageLimit = Number(data.usageLimit);
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);

    const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("PUT /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
