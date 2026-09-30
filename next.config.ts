import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * `object-src 'none'` / `base-uri 'self'` / `frame-ancestors 'none'` close
 * plugin injection, `<base>` tag hijacking and clickjacking; the allowlists
 * below are exactly the origins the storefront talks to (Razorpay, the IFSC
 * and PIN-code lookups, Cloudinary/placehold.co images).
 *
 * Inline script execution is still permitted because Next.js and the
 * no-flash theme script in the root layout are inline and this configuration
 * cannot mint a per-request nonce. Replacing `'unsafe-inline'` with a nonce
 * is the follow-up hardening step; every injection sink that takes user data
 * is already escaped (see `serializeJsonLd`).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://placehold.co",
  "font-src 'self' data:",
  "connect-src 'self' https://api.razorpay.com https://ifsc.razorpay.com https://api.postalpincode.in",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "manifest-src 'self'",
  "worker-src 'self'",
  "media-src 'self'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
    {
      source: "/manifest.json",
      headers: [
        { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
        { key: "Pragma", value: "no-cache" },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
};

export default nextConfig;
