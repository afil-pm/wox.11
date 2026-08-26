import { NextResponse, type NextRequest } from "next/server";

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 100;
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

// TODO: Replace with actual session validation when auth is wired
async function isAuthenticated(_request: NextRequest): Promise<boolean> {
  // For now, check for presence of a session cookie
  // This will be replaced with proper JWT/session validation
  return false;
}

async function isAdmin(_request: NextRequest): Promise<boolean> {
  // TODO: Validate admin role from session/JWT
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Rate limiting
  if (!checkRateLimit(ip)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
        ...getSecurityHeaders(),
      },
    });
  }

  const response = NextResponse.next();

  // Apply security headers to all responses
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Protect /admin routes - require admin role
  if (pathname.startsWith("/admin")) {
    const admin = await isAdmin(request);
    if (!admin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect /checkout routes - require authentication
  if (pathname.startsWith("/checkout")) {
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
