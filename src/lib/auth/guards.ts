import { getSession, sessionSecret, Session } from "@/lib/auth/session";
import { connectMongoDB } from "@/lib/mongodb";
import User, { IUser, SupplierStatus, VerificationStatus } from "@/lib/models/user";

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
  verificationStatus: VerificationStatus;
  status: SupplierStatus;
  canUpdateOrderStatus: boolean;
}

export type SupplierResult =
  | { ok: true; session: Session; supplier: SupplierContext }
  | { ok: false; status: number; code: string; error: string };

/**
 * Verification state lives in the database, so it survives browser closes,
 * reloads, new tabs/devices and localStorage tampering. Accounts created
 * before the field existed keep their old semantics (approved supplierStatus
 * means verified).
 */
export function effectiveVerificationStatus(user: IUser): VerificationStatus {
  if (user.verificationStatus) return user.verificationStatus;
  return user.supplierStatus === "ACTIVE" ? "VERIFIED" : "PENDING_VERIFICATION";
}

/**
 * Resolves the signed-in supplier. Every supplier API route must go through
 * this so ownership can never be taken from the request body, and so a
 * `PENDING_VERIFICATION`/`REJECTED` account can never reach supplier-only data.
 * `requireVerified: false` is only used by the profile route, which has to
 * report the current verification state to the verification pending page.
 */
export async function getSupplier(
  request: AuthedRequest,
  options: { requireVerified?: boolean } = {}
): Promise<SupplierResult> {
  const requireVerified = options.requireVerified !== false;
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

  const verificationStatus = effectiveVerificationStatus(user);

  if (requireVerified && verificationStatus !== "VERIFIED") {
    if (verificationStatus === "REJECTED") {
      return {
        ok: false,
        status: 403,
        code: "verification_rejected",
        error: "Your supplier account verification was rejected. Please contact the store admin.",
      };
    }
    return {
      ok: false,
      status: 403,
      code: "pending_verification",
      error:
        "Your supplier account is currently under verification. You will be able to access supplier features after verification is completed.",
    };
  }

  if (requireVerified && user.supplierStatus === "SUSPENDED") {
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
      verificationStatus,
      status: user.supplierStatus,
      canUpdateOrderStatus: user.supplierPermissions?.canUpdateOrderStatus === true,
    },
  };
}

export function supplierError(result: Extract<SupplierResult, { ok: false }>) {
  return { error: result.error, code: result.code, status: result.status };
}
