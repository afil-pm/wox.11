import { getSession, sessionSecret, Session } from "@/lib/auth/session";
import { connectMongoDB } from "@/lib/mongodb";
import User, { IUser, SupplierStatus } from "@/lib/models/user";

export interface AuthedRequest {
  headers: { get(name: string): string | null };
}

/**
 * Admin access. Server side only: a valid, unexpired ADMIN session token is
 * required. The legacy `x-admin-email` header is honoured exclusively when no
 * session signing secret is configured (local dev), because trusting a plain
 * header would let any supplier who knows the admin email call admin APIs.
 */
export function getAdminSession(request: AuthedRequest): Session | null {
  const session = getSession(request);
  if (session && session.role === "ADMIN") return session;

  if (!sessionSecret()) {
    const adminHeader = request.headers.get("x-admin-email");
    if (!adminHeader) return null;
    const adminEmail = process.env.ADMIN_EMAIL || "";
    const email = adminHeader.toLowerCase();
    if (!adminEmail || email === adminEmail.toLowerCase()) {
      return {
        sub: "admin-env",
        role: "ADMIN",
        email,
        name: "Admin",
        exp: Date.now() + 60_000,
      };
    }
  }

  return null;
}

export function isAdmin(request: AuthedRequest): boolean {
  return getAdminSession(request) !== null;
}

/** Admin identity for audit fields — never read from a raw header when a session secret is configured. */
export function getAdminEmail(request: AuthedRequest): string {
  const session = getAdminSession(request);
  if (session) return session.email;
  if (!sessionSecret()) return request.headers.get("x-admin-email") || "";
  return "";
}

export interface SupplierContext {
  supplierId: string;
  email: string;
  name: string;
  supplierName: string;
  status: SupplierStatus;
  canUpdateOrderStatus: boolean;
}

export type SupplierResult =
  | { ok: true; session: Session; supplier: SupplierContext }
  | { ok: false; status: number; code: string; error: string };

/**
 * Resolves the signed-in supplier. Every supplier API route must go through
 * this so ownership can never be taken from the request body.
 * `requireActive: false` is used by the profile route so an unapproved
 * supplier can still see why the panel is locked.
 */
export async function getSupplier(
  request: AuthedRequest,
  options: { requireActive?: boolean } = {}
): Promise<SupplierResult> {
  const requireActive = options.requireActive !== false;
  const session = getSession(request);

  if (!session) {
    return { ok: false, status: 401, code: "unauthenticated", error: "Sign in required." };
  }
  if (session.role !== "SUPPLIER") {
    return { ok: false, status: 403, code: "not_supplier", error: "Supplier access required." };
  }

  await connectMongoDB();
  const user = (await User.findById(session.sub)) as IUser | null;

  if (!user || user.role !== "SUPPLIER") {
    return { ok: false, status: 403, code: "supplier_not_found", error: "Supplier account not found." };
  }

  if (requireActive && user.supplierStatus !== "ACTIVE") {
    if (user.supplierStatus === "PENDING") {
      return {
        ok: false,
        status: 403,
        code: "pending_approval",
        error: "Your supplier account is waiting for admin approval.",
      };
    }
    return {
      ok: false,
      status: 403,
      code: "suspended",
      error: "Your supplier account has been suspended.",
    };
  }

  return {
    ok: true,
    session,
    supplier: {
      supplierId: String(user._id),
      email: user.email,
      name: user.name,
      supplierName: user.supplierName || user.name,
      status: user.supplierStatus,
      canUpdateOrderStatus: user.supplierPermissions?.canUpdateOrderStatus === true,
    },
  };
}

export function supplierError(result: Extract<SupplierResult, { ok: false }>) {
  return { error: result.error, code: result.code, status: result.status };
}
