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
 *
 * `img-src` accepts any https image because the admin panels let the operator
 * point at image URLs hosted anywhere (product photos, banners, the og:image).
 * Images cannot execute script; script execution stays gated by `script-src`.
 * `connect-src` additionally trusts res.cloudinary.com (the catalogue image
 * host mirrored in next.config remotePatterns, so try-on can fetch garment
 * bytes) and the Decart realtime hosts. LiveKit sessions land on per-region
 * hosts ({region}.lkc.decart.ai, assigned inside the ephemeral token), so the
 * region subdomain is wildcarded — still strictly Decart-owned.
 */
function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? "" : " 'unsafe-eval'"} https://checkout.razorpay.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.razorpay.com https://ifsc.razorpay.com https://api.postalpincode.in https://res.cloudinary.com https://api3.decart.ai wss://api3.decart.ai https://*.lkc.decart.ai wss://*.lkc.decart.ai https://platform.decart.ai",
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
  response.headers.set("Permissions-Policy", permissionsPolicy(request.nextUrl.pathname));

  return response;
}

/**
 * Permissions-Policy lives here instead of `next.config.ts` because it must
 * vary by route: virtual try-on needs camera access on product detail pages,
 * and nowhere else. Everywhere else the camera stays disabled at the policy
 * level, so no other page can even trigger a permission prompt. Note the
 * policy only *allows* the request — the browser still asks the user, and
 * the Try On Wear button is the only code path that ever asks.
 */
function permissionsPolicy(pathname: string): string {
  const isProductPage =
    /^\/men\/[^/]+\/[^/]+\/?$/.test(pathname) || /^\/boys\/[^/]+\/[^/]+\/?$/.test(pathname);
  return `camera=${isProductPage ? "(self)" : "()"}, microphone=(), geolocation=()`;
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
