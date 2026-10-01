import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import SearchLog from "@/lib/models/search-log";
import { isAdmin } from "@/lib/auth/guards";

/**
 * Aggregated zero-result searches, busiest query first, with the individual
 * shoppers behind each count so merchandising can see who to answer.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectMongoDB();

    const logs = await SearchLog.find()
      .sort({ count: -1, lastAt: -1 })
      .limit(500)
      .lean();

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: String(log._id),
        query: log.query,
        display: log.display,
        count: log.count,
        firstAt: log.firstAt,
        lastAt: log.lastAt,
        notifiedCount: (log.notified || []).length,
        searchers: (log.searchers || [])
          .slice()
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
          .map((s) => ({
            userId: s.userId || null,
            name: s.name || "",
            at: s.at,
          })),
      })),
    });
  } catch (error) {
    console.error("GET /api/wox/admin/search-logs error:", error);
    return NextResponse.json({ logs: [] });
  }
}
