import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

/**
 * Per-request Content-Security-Policy.
 *
 * `next.config.ts` can only emit a fixed header (it has no request context),
 * which is why script execution previously had to be opened up with
 * `'unsafe-inline'`. Generating a fresh nonce here lets `script-src` drop
 * `'unsafe-inline'` entirely:
 *
 *   script-src 'nonce-…' 'strict-dynamic'
 *
 * Next.js reads the `Content-Security-Policy` request header we forward below
 * and stamps the same nonce onto its own framework/bootstrap scripts, and the
 * root layout stamps it on the two inline scripts it renders (theme + splash).
 * `'unsafe-eval'` stays a development-only allowance because React uses `eval`
 * for the devtools stack traces.
 *
 * `style-src` keeps `'unsafe-inline'` on purpose: React renders `style="…"`
 * attributes (progress bars, charts, the splash overlay) and those cannot
 * carry a nonce. CSS injection is not a script-execution primitive and every
 * sink that emits user data is escaped separately.
 */
function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? "" : " 'unsafe-eval'"} https://checkout.razorpay.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://placehold.co",
    "font-src 'self' data:",
    "connect-src 'self' https://api.razorpay.com https://ifsc.razorpay.com https://api.postalpincode.in",
    "frame-src https://api.razorpay.com https://checkout.razorpay.com",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "media-src 'self'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const csp = contentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  // Pages only: API routes answer JSON (no document to protect) and static
  // assets are served straight from disk. Prefetch/RSC payload requests are
  // skipped — they carry no executable document either.
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|sitemap.xml|opengraph-image|icons/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
