import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import { getSupplier } from "@/lib/auth/guards";
import { getSupplierSlugs, supplierOrderFilter } from "@/lib/supplier/view";
import { applyOrderStatusChange } from "@/lib/orders/status-change";

export const dynamic = "force-dynamic";

/**
 * Status updates are only possible when the admin enabled the supplier's
 * `canUpdateOrderStatus` permission; suppliers may then use the same status
 * transitions as the admin panel.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSupplier(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
    }

    if (!auth.supplier.canUpdateOrderStatus) {
      return NextResponse.json(
        { error: "Status updates are not enabled for this supplier account.", code: "permission_denied" },
        { status: 403 }
      );
    }

    await connectMongoDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = typeof body.status === "string" ? body.status : "";

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const slugs = await getSupplierSlugs(auth.supplier.supplierId);
    const order = await Order.findOne({
      _id: id,
      $or: supplierOrderFilter(auth.supplier.supplierId, slugs),
    })
      .select("_id")
      .lean()
      .catch(() => null);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const result = await applyOrderStatusChange(String(order._id), status);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ message: "Order status updated", order: result.order });
  } catch (error) {
    console.error("PUT /api/wox/supplier/orders/[id]/status error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
