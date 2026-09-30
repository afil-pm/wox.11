import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { loadTwoFactor } from "@/lib/auth/two-factor";

/** Whether this account currently has a second factor switched on. */
export async function GET(request: Request) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const state = await loadTwoFactor(session.sub);
    return NextResponse.json({ enabled: Boolean(state?.enabled) });
  } catch (error) {
    console.error("[TWO_FACTOR_STATUS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
