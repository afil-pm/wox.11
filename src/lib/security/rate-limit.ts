/**
 * Small in-memory fixed-window rate limiter.
 *
 * It is per instance (no Redis) which is fine for a single node deployment and
 * for brute-force damping — it only ever has to make online guessing
 * uneconomic, not be a perfect distributed counter.
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
 * Records one attempt against `key` and reports whether it is still allowed.
 *
 * @param bucket  logical group, e.g. "login" or "recovery-status"
 * @param key     subject, usually the client IP or a normalised email
 */
export function rateLimit(bucket: string, key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const id = `${bucket}:${key}`;
  const existing = buckets.get(id);

  if (!existing || existing.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  return { ok: true, remaining: limit - existing.count, retryAfterSeconds };
}

/** Clears a bucket after a successful action so failures alone consume the budget. */
export function resetRateLimit(bucket: string, key: string): void {
  buckets.delete(`${bucket}:${key}`);
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
