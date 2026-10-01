import { connectMongoDB } from "@/lib/mongodb";
import SearchLog, { MAX_NOTIFIED, MAX_SEARCHERS } from "@/lib/models/search-log";
import { notifyUser } from "@/lib/notify";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;

/**
 * Collapses case/whitespace and strips control characters so the same query
 * typed three different ways aggregates into one row.
 */
export function normalizeSearchQuery(raw: unknown): string {
  return String(raw ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, MAX_QUERY_LENGTH);
}

/**
 * Stores one aggregated row per distinct query that returned nothing.
 * Never throws: analytics must not break the storefront search.
 */
export async function recordZeroResultSearch(input: {
  query: string;
  userId?: string | null;
  name?: string | null;
}): Promise<void> {
  try {
    const query = normalizeSearchQuery(input.query);
    if (query.length < MIN_QUERY_LENGTH) return;

    await connectMongoDB();

    const now = new Date();
    const display = String(input.query ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_QUERY_LENGTH);
    const searcher = {
      userId: input.userId || null,
      name: input.name || "",
      at: now,
    };

    await SearchLog.updateOne(
      { query },
      {
        $set: { display, lastAt: now },
        // `count` is deliberately absent here: `$inc` owns that path and
        // naming it in `$setOnInsert` too would be a conflicting update.
        $setOnInsert: { firstAt: now, notified: [] },
        $inc: { count: 1 },
        $push: { searchers: { $each: [searcher], $slice: -MAX_SEARCHERS } },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("recordZeroResultSearch error:", error);
  }
}

export interface SearchMatchProduct {
  name: string;
  sku?: string;
  isActive?: boolean;
  category?: { name?: string; type?: string; gender?: string } | null;
}

function haystackFor(product: SearchMatchProduct): string {
  return [
    product.name,
    product.sku,
    product.category?.name,
    product.category?.type,
    product.category?.gender,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * A query matches a product when the whole phrase appears in its text, or when
 * every word of the query does — so "blue formal shirt" still fires on a
 * "Formal Blue Shirt" without matching unrelated single words.
 */
function matches(query: string, haystack: string): boolean {
  if (haystack.includes(query)) return true;
  const tokens = query.split(" ").filter(Boolean);
  if (tokens.length < 2) return false;
  return tokens.every((token) => haystack.includes(token));
}

/**
 * Tells every shopper who searched for something the store did not carry that
 * a product matching their query just went live. One notice per query per user,
 * ever: `notified` and the notification `dedupeKey` both guard against repeats.
 * Fire and forget — a push problem never fails the product save.
 */
export async function notifySearchMatches(product: SearchMatchProduct): Promise<void> {
  try {
    if (product.isActive === false) return;

    const query = normalizeSearchQuery(product.name);
    if (!query) return;

    const haystack = haystackFor(product);
    if (!haystack) return;

    await connectMongoDB();

    const logs = await SearchLog.find({ count: { $gt: 0 } })
      .select("query display searchers notified")
      .lean();

    const category = product.category;
    const url =
      category?.gender && category?.type ? `/${category.gender}/${category.type}` : "/";

    for (const log of logs) {
      if (!matches(log.query, haystack)) continue;

      const notified = new Set(log.notified || []);
      if (notified.size >= MAX_NOTIFIED) continue;

      const userIds = [
        ...new Set(
          (log.searchers || [])
            .map((s) => s.userId)
            .filter((id): id is string => Boolean(id) && !notified.has(String(id)))
        ),
      ];
      if (userIds.length === 0) continue;

      for (const userId of userIds) {
        await notifyUser({
          userId,
          title: "Found a match for your search",
          body: `We just added "${product.name}" — it matches your search for "${log.display}".`,
          type: "search_match",
          url,
          tag: `search-match-${log.query}`,
          dedupeKey: `search-match:${log.query}:${userId}`,
        });
      }

      await SearchLog.updateOne(
        { _id: log._id },
        { $addToSet: { notified: { $each: userIds } } }
      );
    }
  } catch (error) {
    console.error("notifySearchMatches error:", error);
  }
}
