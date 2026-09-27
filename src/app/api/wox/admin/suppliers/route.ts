import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";
import Product from "@/lib/models/product";
import { isAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectMongoDB();
    const suppliers = await User.find({ role: "SUPPLIER" }).sort({ createdAt: -1 }).lean();

    const ids = suppliers.map((s) => String(s._id));
    const counts = ids.length
      ? await Product.aggregate([
          { $match: { supplierId: { $in: ids } } },
          { $group: { _id: "$supplierId", products: { $sum: 1 } } },
        ])
      : [];
    const countMap = new Map(counts.map((c) => [String(c._id), c.products]));

    return NextResponse.json({
      suppliers: suppliers.map((s) => ({
        id: String(s._id),
        name: s.name,
        email: s.email,
        supplierName: s.supplierName || s.name,
        status: s.supplierStatus,
        canUpdateOrderStatus: s.supplierPermissions?.canUpdateOrderStatus === true,
        products: countMap.get(String(s._id)) || 0,
        createdAt: s.createdAt,
        supplierApprovedAt: s.supplierApprovedAt || null,
      })),
      total: suppliers.length,
    });
  } catch (error) {
    console.error("GET /api/wox/admin/suppliers error:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}
