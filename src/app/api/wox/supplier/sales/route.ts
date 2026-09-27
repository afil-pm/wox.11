import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { getSupplier } from "@/lib/auth/guards";
import { getSupplierSlugs } from "@/lib/supplier/view";
import { computeSupplierSales } from "@/lib/supplier/sales";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await getSupplier(request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error, code: auth.code },
        { status: auth.status }
      );
    }

    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get("days") || "30", 10);
    const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 0;

    const slugs = await getSupplierSlugs(auth.supplier.supplierId);
    const sales = await computeSupplierSales(auth.supplier.supplierId, slugs, days);

    return NextResponse.json({ sales, days });
  } catch (error) {
    console.error("GET /api/wox/supplier/sales error:", error);
    return NextResponse.json({ error: "Failed to load sales" }, { status: 500 });
  }
}
