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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoDB();
    const { id } = await params;
    const userId = request.headers.get("x-user-id") || "";

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isAdmin(request) && userId && order.userId !== userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET /api/mongo/orders/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoDB();
    const { id } = await params;
    const userId = request.headers.get("x-user-id") || "";
    const body = await request.json();
    const { status, paymentStatus } = body;

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const admin = isAdmin(request);
    if (!admin && userId && order.userId !== userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
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

    const update: Record<string, unknown> = {};

    if (status) {
      if (!admin) {
        return NextResponse.json({ error: "Only admin can change order status" }, { status: 403 });
      }
      const allowed = validTransitions[order.status] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${order.status} to ${status}` },
          { status: 400 }
        );
      }
      update.status = status;
    }

    if (paymentStatus) {
      if (!admin) {
        return NextResponse.json({ error: "Only admin can change payment status" }, { status: 403 });
      }
      update.paymentStatus = paymentStatus;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, update, { new: true }).lean();
    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("PATCH /api/mongo/orders/[id] error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
