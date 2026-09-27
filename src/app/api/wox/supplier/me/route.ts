import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Order from "@/lib/models/order";
import { getSupplier } from "@/lib/auth/guards";
import { getSupplierSlugs, supplierOrderFilter } from "@/lib/supplier/view";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await getSupplier(request, { requireActive: false });
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error, code: auth.code },
        { status: auth.status }
      );
    }

    await connectMongoDB();
    const { supplier } = auth;

    const slugs = await getSupplierSlugs(supplier.supplierId);
    const orderQuery = { $or: supplierOrderFilter(supplier.supplierId, slugs) };

    const [totalProducts, activeProducts, orderCount, pendingOrders] = await Promise.all([
      Product.countDocuments({ supplierId: supplier.supplierId }),
      Product.countDocuments({ supplierId: supplier.supplierId, isActive: true }),
      Order.countDocuments(orderQuery),
      Order.countDocuments({
        $and: [orderQuery, { status: { $in: ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"] } }],
      }),
    ]);

    return NextResponse.json({
      supplier: {
        id: supplier.supplierId,
        name: supplier.name,
        email: supplier.email,
        supplierName: supplier.supplierName,
        status: supplier.status,
        canUpdateOrderStatus: supplier.canUpdateOrderStatus,
      },
      stats: { totalProducts, activeProducts, orderCount, pendingOrders },
    });
  } catch (error) {
    console.error("GET /api/wox/supplier/me error:", error);
    return NextResponse.json({ error: "Failed to load supplier profile" }, { status: 500 });
  }
}
