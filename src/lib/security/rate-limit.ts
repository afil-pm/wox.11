import crypto from "crypto";
import { connectMongoDB } from "@/lib/mongodb";

/**
 * Fixed-window rate limiter.
 *
 * The count lives in process memory so the hot path never waits on the
 * database, but every change is mirrored to a MongoDB collection and the
 * counters are reloaded when the process boots. That closes the "restart, and
 * the attacker gets 10 fresh login attempts" gap that a purely in-memory
 * limiter has, while still working (fail-open, in memory only) if the database
 * happens to be unreachable.
 *
 * It is per instance rather than distributed: several instances each get their
 * own copy of the window, which is fine for brute-force damping — it only has
 * to make online guessing uneconomic, not be a perfect global counter.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Bound the map so a flood of distinct keys cannot grow it without limit.
const MAX_BUCKETS = 20_000;

function sweep(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Still oversized: drop the oldest entries rather than grow unbounded.
  if (buckets.size >= MAX_BUCKETS) {
    const extra = buckets.size - MAX_BUCKETS + 1;
    let dropped = 0;
    for (const key of buckets.keys()) {
      if (dropped >= extra) break;
      buckets.delete(key);
      dropped++;
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * The key is usually an email address, so it is hashed before it ever reaches
 * the database (`sha256(bucket:key)` is also a valid Mongo `_id`).
 */
function bucketId(bucket: string, key: string): string {
  return crypto.createHash("sha256").update(`${bucket}:${key}`).digest("hex");
}

let hydration: Promise<void> | null = null;
let nextHydrateAttempt = 0;

async function loadPersisted(): Promise<void> {
  try {
    const { default: RateLimit } = await import("@/lib/models/rate-limit");
    await connectMongoDB();
    const rows = (await RateLimit.find({ expiresAt: { $gt: new Date() } })
      .limit(MAX_BUCKETS)
      .lean()) as unknown as { _id: string; count: number; expiresAt: Date }[];

    for (const row of rows) {
      if (!row || typeof row._id !== "string") continue;
      // A request that landed while we were loading already owns this window;
      // keep the live count instead of overwriting it with the stored one.
      if (buckets.has(row._id)) continue;
      const resetAt = new Date(row.expiresAt).getTime();
      if (!Number.isFinite(resetAt) || resetAt <= Date.now()) continue;
      buckets.set(row._id, { count: Number(row.count) || 0, resetAt });
    }
  } catch {
    // Database unavailable (or still connecting): run purely from memory and
    // try the reload again the next time a limit is checked — but not on every
    // single check, so a down database is not hammered with reconnects.
    hydration = null;
    nextHydrateAttempt = Date.now() + 30_000;
  }
}

/** Reload once per process. Safe to call on every check. */
function hydrate(): void {
  if (hydration || Date.now() < nextHydrateAttempt) return;
  nextHydrateAttempt = Number.MAX_SAFE_INTEGER;
  hydration = loadPersisted();
}

async function persist(id: string, count: number, resetAt: number): Promise<void> {
  try {
    const { default: RateLimit } = await import("@/lib/models/rate-limit");
    await connectMongoDB();
    await RateLimit.updateOne(
      { _id: id },
      { $set: { count, expiresAt: new Date(resetAt) } },
      { upsert: true }
    );
  } catch {
    // Best effort: the in-memory count still protects this process.
  }
}

async function forget(id: string): Promise<void> {
  try {
    const { default: RateLimit } = await import("@/lib/models/rate-limit");
    await connectMongoDB();
    await RateLimit.deleteOne({ _id: id });
  } catch {}
}

/**
 * Records one attempt against `key` and reports whether it is still allowed.
 *
 * @param bucket  logical group, e.g. "login" or "recovery-status"
 * @param key     subject, usually the client IP or a normalised email
 */
export function rateLimit(bucket: string, key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  hydrate();

  const id = bucketId(bucket, key);
  const existing = buckets.get(id);

  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(id, fresh);
    void persist(id, fresh.count, fresh.resetAt);
    return { ok: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  void persist(id, existing.count, existing.resetAt);

  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  return { ok: true, remaining: limit - existing.count, retryAfterSeconds };
}

/** Clears a bucket after a successful action so failures alone consume the budget. */
export function resetRateLimit(bucket: string, key: string): void {
  const id = bucketId(bucket, key);
  buckets.delete(id);
  void forget(id);
}

/**
 * Best effort client IP.
 *
 * Proxies prepend the real client address and append their own, so the *last*
 * `x-forwarded-for` entry is the one we can trust most; `x-real-ip` is set by
 * the platform in front of us. Using the first entry (the common shortcut)
 * would let a caller pick its own rate-limit identity by sending the header.
 */
export function clientIp(request: { headers: { get(name: string): string | null } }): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    const parts = vercelForwarded.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return "local";
}

/** 429 helper with a `Retry-After` header. */
export function tooManyRequests(retryAfterSeconds: number): { status: number; headers: Record<string, string> } {
  return {
    status: 429,
    headers: { "Retry-After": String(retryAfterSeconds) },
  };
}
