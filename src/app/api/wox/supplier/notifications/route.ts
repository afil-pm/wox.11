import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Notification from "@/lib/models/notification";
import { getSupplier } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

/**
 * The supplier's own notification feed. Rows are keyed by the supplier's user
 * id, and the session decides which id that is — a supplier can never read
 * another supplier's notifications, and store-wide `all` broadcasts are not
 * part of this feed either.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getSupplier(request, { requireVerified: false });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error, code: auth.code }, { status: auth.status });
    }

    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30", 10) || 30, 1), 100);
    const unreadOnly = searchParams.get("unread") === "true";
    const userId = auth.supplier.supplierId;

    const filter: Record<string, unknown> = { userId };
    if (unreadOnly) filter.read = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ userId, read: false }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET /api/wox/supplier/notifications error:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}
