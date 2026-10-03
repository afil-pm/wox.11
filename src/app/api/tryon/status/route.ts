import { NextResponse } from "next/server";

/**
 * Public capability flag for virtual try-on. The permanent Decart key never
 * leaves the server; the client uses this only to decide whether a live
 * session is possible (otherwise it runs a local camera preview).
 */
export async function GET() {
  const enabled = (process.env.DECART_API_KEY || "").trim().length > 0;
  return NextResponse.json({ enabled });
}
