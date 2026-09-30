import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Server side logout. Browsers keep an HttpOnly session cookie, so clearing
 * `localStorage` alone would leave the session alive for anyone who later
 * obtains the cookie — the cookie has to be expired by the server too.
 */
export async function POST() {
  try {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
  } catch {
    // Nothing to clear.
  }
  return NextResponse.json({ ok: true });
}
