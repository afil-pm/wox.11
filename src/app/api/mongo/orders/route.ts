import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import { sendNewOrderEmail } from "@/lib/email";

function isAdmin(request: NextRequest): boolean {
  const adminHeader = request.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const status = searchParams.get("status");
    const userId = request.headers.get("x-user-id") || searchParams.get("userId") || "";

    if (!userId && !isAdmin(request)) {
      return NextResponse.json({ orders: [], total: 0 });
    }

    const filter: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (!isAdmin(request) && userId) {
      filter.userId = userId;
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
      userId,
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
      paymentId,
      paymentStatus,
      notes,
    } = body;

    if (!orderNumber || !items?.length || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const hasInvalidItems = items.some(
      (item: { price: number; quantity: number }) => !item.price || item.price <= 0 || !item.quantity || item.quantity <= 0
    );
    if (hasInvalidItems) {
      return NextResponse.json(
        { error: "All items must have a valid price greater than ₹0" },
        { status: 400 }
      );
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: "Order total must be greater than ₹0" },
        { status: 400 }
      );
    }

    const order = await Order.create({
      orderNumber,
      userId: userId || "",
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
      paymentId: paymentId || "",
      paymentStatus: paymentStatus || (paymentMethod === "cod" ? "PENDING" : "PENDING"),
      status: "PENDING",
      notes: notes || "",
    });

    sendNewOrderEmail({
      orderNumber,
      customerName: customerName || address.name,
      customerPhone: customerPhone || address.phone,
      customerEmail: customerEmail || "",
      address,
      items,
      total: total || 0,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentStatus || "PENDING",
    }).catch(() => {});

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/mongo/orders error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
