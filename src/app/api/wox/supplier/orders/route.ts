import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import { getSupplier } from "@/lib/auth/guards";
import { getSupplierSlugs, supplierOrderFilter, toSupplierOrder } from "@/lib/supplier/view";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await getSupplier(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
    }

    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const slugs = await getSupplierSlugs(auth.supplier.supplierId);
    const ownedSlugs = new Set(slugs);

    const and: Record<string, unknown>[] = [{ $or: supplierOrderFilter(auth.supplier.supplierId, slugs) }];
    if (status && status !== "ALL") {
      and.push({ status });
    }

    const filter = { $and: and };
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    // Only orders that still contain at least one line of this supplier are
    // handed out; the rest would expose another supplier's order details.
    const views = orders
      .map((order) => toSupplierOrder(order, ownedSlugs))
      .filter((view) => view.items.length > 0);

    return NextResponse.json({
      orders: views,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/wox/supplier/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
