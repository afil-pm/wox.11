import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { getSupplier } from "@/lib/auth/guards";
import { getSupplierSlugs } from "@/lib/supplier/view";
import { computeSupplierDashboard } from "@/lib/supplier/analytics";

export const dynamic = "force-dynamic";

/**
 * Dashboard overview numbers for the signed-in supplier only: revenue and
 * order counts are computed from their own order lines, product counts from
 * their own listings. A supplier can never see another supplier's figures —
 * the scope comes from the session, not from anything in the query string.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getSupplier(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
    }

    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const tzOffset = parseInt(searchParams.get("tzOffset") || "0", 10) || 0;

    const slugs = await getSupplierSlugs(auth.supplier.supplierId);
    const dashboard = await computeSupplierDashboard(auth.supplier.supplierId, slugs, tzOffset);

    return NextResponse.json({
      supplier: { name: auth.supplier.supplierName },
      ...dashboard,
    });
  } catch (error) {
    console.error("GET /api/wox/supplier/stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard statistics" }, { status: 500 });
  }
}
