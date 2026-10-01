import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { getSession } from "@/lib/auth/session";
import { normalizeSearchQuery, recordZeroResultSearch } from "@/lib/search-log";

/**
 * Records a storefront search that came back empty so merchandising can see
 * what shoppers want and the store does not carry. Logged out shoppers count
 * too — the demand signal does not depend on an account.
 */
export async function POST(request: NextRequest) {
  try {
    // Bounded write endpoint: drops floods quietly instead of answering 429 to
    // a shopper's browser tab.
    if (!rateLimit("search-log", clientIp(request), 30, 60_000).ok) {
      return NextResponse.json({ ok: true });
    }

    let body: { query?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const raw = typeof body.query === "string" ? body.query : "";
    if (normalizeSearchQuery(raw).length < 2) {
      return NextResponse.json({ ok: true });
    }

    const session = getSession(request);
    await recordZeroResultSearch({
      query: raw,
      userId: session?.sub || null,
      name: session?.name || "",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/search/log error:", error);
    return NextResponse.json({ ok: true });
  }
}
