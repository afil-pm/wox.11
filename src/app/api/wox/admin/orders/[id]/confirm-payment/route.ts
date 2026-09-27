import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import { markOrderPaidManually } from "@/lib/payments/confirm";

function isAdmin(request: NextRequest): boolean {
  const adminHeader = request.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

/**
 * Manual confirmation for an online payment the admin verified by hand
 * (used when a payment was flagged for review). Inventory, coupon usage and
 * notifications are handled exactly like an automatic confirmation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectMongoDB();
    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentMethod === "cod") {
      return NextResponse.json(
        { error: "COD payments are confirmed from the COD action" },
        { status: 400 }
      );
    }

    if (order.paymentStatus === "PAID" || order.paymentStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "Payment is already confirmed" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const paymentId = typeof body.paymentId === "string" ? body.paymentId.trim() : "";
    const adminEmail = request.headers.get("x-admin-email") || "";

    const result = await markOrderPaidManually(
      order._id.toString(),
      adminEmail,
      paymentId || undefined
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message || "Payment could not be confirmed" },
        { status: 400 }
      );
    }

    const updated = await Order.findById(order._id).lean();

    return NextResponse.json({
      message: "Payment confirmed",
      order: updated,
      result,
    });
  } catch (error) {
    console.error("POST /api/wox/admin/orders/[id]/confirm-payment error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
