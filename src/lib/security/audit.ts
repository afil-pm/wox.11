/**
 * Structured security event log.
 *
 * Events are emitted as single-line JSON on the server console so they land in
 * the host's log pipeline (Vercel / PM2 / journald) without writing to disk —
 * serverless filesystems are read-only outside `/tmp`.
 *
 * Never put a password, token, recovery code or bank account number in here.
 */
export type AuditEvent =
  | "admin_denied"
  | "supplier_denied"
  | "customer_identity_rejected"
  | "login_failed"
  | "login_rate_limited"
  | "register_rate_limited"
  | "reset_rate_limited"
  | "recovery_status_denied"
  | "recovery_status_rate_limited"
  | "payment_replay_blocked"
  | "payment_unverified"
  | "checkout_session_ownership_denied"
  | "notification_forbidden"
  | "unsafe_input_rejected";

export interface AuditContext {
  route?: string;
  userId?: string;
  email?: string;
  reason?: string;
  ip?: string;
  orderId?: string;
  [key: string]: unknown;
}

const REDACTED_KEYS = /password|token|secret|recovery|accountnumber|ifsc|otp/i;

function sanitize(context: AuditContext): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (REDACTED_KEYS.test(key)) {
      clean[key] = "[redacted]";
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

export function audit(event: AuditEvent, context: AuditContext = {}): void {
  try {
    const entry = {
      ts: new Date().toISOString(),
      level: "warn",
      audit: event,
      ...sanitize(context),
    };
    console.warn(`[AUDIT] ${JSON.stringify(entry)}`);
  } catch {
    // Logging must never break a request.
  }
}
