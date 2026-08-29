import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";

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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
    }

    const validTransitions: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["PACKED", "CANCELLED"],
      PACKED: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["OUT_FOR_DELIVERY", "RETURNED"],
      OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED"],
      DELIVERED: ["RETURNED"],
      CANCELLED: [],
      RETURNED: ["REFUNDED"],
      REFUNDED: [],
    };

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const allowed = validTransitions[existingOrder.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${existingOrder.status} to ${status}` },
        { status: 400 }
      );
    }

    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true }).lean();
    return NextResponse.json({ message: "Order status updated", order });
  } catch (error) {
    console.error("PUT /api/admin/orders error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
