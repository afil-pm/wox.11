/**
 * Anything written to `localStorage` is readable by any script running on the
 * page, so the browser copy of the signed-in user may only ever contain
 * display state (`id`, `name`, `role`, …) — never a credential.
 *
 * The session itself lives in the HttpOnly `wox-session` cookie and is sent
 * automatically by `fetch`; it is deliberately absent from the stored profile.
 * The login/register responses still return `token` for non-browser API
 * clients (Bearer auth), we just refuse to persist it here.
 */
const NEVER_STORE_LOCALLY = [
  "token",
  "sessiontoken",
  "accesstoken",
  "refreshtoken",
  "password",
  "recoverycode",
  "secret",
];

export function safeStoredUser(user: unknown): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (!user || typeof user !== "object") return clean;
  for (const [key, value] of Object.entries(user as Record<string, unknown>)) {
    if (NEVER_STORE_LOCALLY.includes(key.toLowerCase())) continue;
    clean[key] = value;
  }
  return clean;
}
