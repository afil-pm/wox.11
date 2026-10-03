import { NextRequest, NextResponse } from "next/server";
import { createDecartClient } from "@decartai/sdk";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const TOKEN_TTL_SECONDS = 600;

/**
 * Mints a short-lived Decart client token for one virtual try-on session.
 * The permanent DECART_API_KEY never leaves the server: the browser only
 * ever receives this ephemeral token. Rate-limited per IP because each
 * token can open a billable realtime session.
 */
export async function POST(request: NextRequest) {
  try {
    const rate = rateLimit("tryon-token", clientIp(request), 10, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const apiKey = (process.env.DECART_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "VIRTUAL_TRYON_NOT_CONFIGURED", message: "Virtual try-on is not configured." },
        { status: 503 }
      );
    }

    const client = createDecartClient({ apiKey });
    const token = await client.tokens.create({
      expiresIn: TOKEN_TTL_SECONDS,
      allowedModels: ["lucy-vton-latest"],
      constraints: { realtime: { maxSessionDuration: TOKEN_TTL_SECONDS } },
    });

    return NextResponse.json({ apiKey: token.apiKey, expiresAt: token.expiresAt });
  } catch {
    return NextResponse.json(
      { error: "VIRTUAL_TRYON_TOKEN_FAILED", message: "Could not start the try-on session." },
      { status: 502 }
    );
  }
}
