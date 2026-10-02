import { NextResponse } from "next/server";
import { getActiveHeroSlides } from "@/lib/hero-slides-server";

/**
 * Active hero slides for storefront consumers. The homepage itself reads them
 * server-side on render; this endpoint stays for API clients and must never
 * serve a stale banner — an admin save is visible on the next request.
 */
export async function GET() {
  const slides = await getActiveHeroSlides();
  return NextResponse.json(
    { slides },
    { headers: { "Cache-Control": "no-store" } }
  );
}
