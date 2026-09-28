import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { getSupplier } from "@/lib/auth/guards";
import { getSupplierSlugs } from "@/lib/supplier/view";
import { computeSupplierAnalytics, resolveRange, RangeKey } from "@/lib/supplier/analytics";

export const dynamic = "force-dynamic";

const VALID_RANGES: RangeKey[] = [
  "today",
  "yesterday",
  "7d",
  "30d",
  "week",
  "month",
  "lastmonth",
  "year",
  "all",
  "custom",
];

/**
 * Time based revenue report for the signed-in supplier's own products only.
 * `range` picks a preset (today / yesterday / 7d / 30d / week / month /
 * lastmonth / year / all) and `from` + `to` give an arbitrary custom window.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getSupplier(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
    }

    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const requested = searchParams.get("range") || "30d";
    const range = (VALID_RANGES.includes(requested as RangeKey) ? requested : "30d") as RangeKey;
    const tzOffset = parseInt(searchParams.get("tzOffset") || "0", 10) || 0;

    const resolved = resolveRange({
      range,
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      tzOffset,
    });

    const slugs = await getSupplierSlugs(auth.supplier.supplierId);
    const analytics = await computeSupplierAnalytics(auth.supplier.supplierId, slugs, resolved, tzOffset);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("GET /api/wox/supplier/analytics error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
