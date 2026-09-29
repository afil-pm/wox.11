import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Order from "@/lib/models/order";
import { getSupplier } from "@/lib/auth/guards";
import { getSupplierSlugs, supplierOrderFilter } from "@/lib/supplier/view";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await getSupplier(request, { requireVerified: false });
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error, code: auth.code },
        { status: auth.status }
      );
    }

    await connectMongoDB();
    const { supplier } = auth;

    const profile = {
      id: supplier.supplierId,
      name: supplier.name,
      email: supplier.email,
      supplierName: supplier.supplierName,
      verificationStatus: supplier.verificationStatus,
      status: supplier.status,
      canUpdateOrderStatus: supplier.canUpdateOrderStatus,
    };

    // A supplier that is not verified yet must not see any panel data.
    if (supplier.verificationStatus !== "VERIFIED") {
      return NextResponse.json({
        supplier: profile,
        store: null,
        stats: { totalProducts: 0, activeProducts: 0, orderCount: 0, pendingOrders: 0 },
      });
    }

    // The supplier's store record backs every product they create; it is
    // created on first use from the verified account details.
    const { ensureSupplierStore } = await import("@/lib/stores");
    const store = await ensureSupplierStore(supplier.supplierId, supplier.supplierName);

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
      supplier: profile,
      store,
      stats: { totalProducts, activeProducts, orderCount, pendingOrders },
    });
  } catch (error) {
    console.error("GET /api/wox/supplier/me error:", error);
    return NextResponse.json({ error: "Failed to load supplier profile" }, { status: 500 });
  }
}
