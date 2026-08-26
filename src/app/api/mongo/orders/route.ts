import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({ orders, total, limit, skip });
  } catch (error) {
    console.error("GET /api/mongo/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    const body = await request.json();

    const {
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      address,
      items,
      subtotal,
      shippingCost,
      tax,
      total,
      paymentMethod,
      notes,
    } = body;

    if (!orderNumber || !items?.length || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const order = await Order.create({
      orderNumber,
      customerName: customerName || address.name,
      customerPhone: customerPhone || address.phone,
      customerEmail: customerEmail || "",
      address,
      items,
      subtotal: subtotal || 0,
      shippingCost: shippingCost || 0,
      tax: tax || 0,
      total: total || 0,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "cod" ? "PENDING" : "PENDING",
      status: "PENDING",
      notes: notes || "",
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/mongo/orders error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
