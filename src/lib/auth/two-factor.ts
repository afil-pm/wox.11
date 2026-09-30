import { connectMongoDB } from "@/lib/mongodb";
import TwoFactor from "@/lib/models/two-factor";
import {
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  normaliseBackupCode,
  verifyTotp,
} from "@/lib/auth/totp";
import { audit } from "@/lib/security/audit";

export interface TwoFactorState {
  subject: string;
  secret: string;
  enabled: boolean;
  backupCodes: string[];
}

export async function loadTwoFactor(subject: string): Promise<TwoFactorState | null> {
  await connectMongoDB();
  const doc = await TwoFactor.findById(subject).lean();
  if (!doc) return null;
  return {
    subject: String(doc._id),
    secret: String(doc.secret || ""),
    enabled: Boolean(doc.enabled),
    backupCodes: Array.isArray(doc.backupCodes) ? doc.backupCodes.map(String) : [],
  };
}

/** Idempotent: re-enrolling replaces the secret and burns old backup codes. */
export async function beginEnrolment(subject: string): Promise<TwoFactorState> {
  const secret = generateTotpSecret();
  await connectMongoDB();
  await TwoFactor.findByIdAndUpdate(
    subject,
    { $set: { subject, secret, enabled: false, backupCodes: [], usedChallenges: [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { subject, secret, enabled: false, backupCodes: [] };
}

export interface SecondFactorResult {
  ok: boolean;
  reason?: "missing" | "invalid_code";
  usedBackupCode?: boolean;
}

/**
 * Verifies a TOTP code, or consumes a backup code. The code path and the
 * backup path both run through the same call so a caller cannot distinguish
 * "no enrolment" from "wrong code" by timing alone beyond the single lookup
 * they all pay for.
 */
export async function verifySecondFactor(subject: string, code: string): Promise<SecondFactorResult> {
  const state = await loadTwoFactor(subject);
  if (!state || !state.enabled || !state.secret) {
    return { ok: false, reason: "missing" };
  }

  const trimmed = String(code || "").trim();

  if (/^\d{6}$/.test(trimmed)) {
    if (verifyTotp(state.secret, trimmed)) return { ok: true };
    return { ok: false, reason: "invalid_code" };
  }

  const digest = hashBackupCode(trimmed);
  if (digest && state.backupCodes.includes(digest)) {
    await connectMongoDB();
    await TwoFactor.updateOne({ _id: subject }, { $pull: { backupCodes: digest } });
    audit("two_factor_backup_used", { userId: subject });
    return { ok: true, usedBackupCode: true };
  }

  return { ok: false, reason: "invalid_code" };
}

export interface EnrolmentComplete {
  backupCodes: string[];
}

/** Flips enrolment on after a confirming code and hands back one-time codes. */
export async function completeEnrolment(subject: string, code: string): Promise<SecondFactorResult & EnrolmentComplete> {
  const state = await loadTwoFactor(subject);
  if (!state || !state.secret) return { ok: false, reason: "missing", backupCodes: [] };

  const trimmed = String(code || "").trim();
  if (!/^\d{6}$/.test(trimmed) || !verifyTotp(state.secret, trimmed)) {
    return { ok: false, reason: "invalid_code", backupCodes: [] };
  }

  const backupCodes = generateBackupCodes();
  await connectMongoDB();
  await TwoFactor.updateOne(
    { _id: subject },
    { $set: { enabled: true, backupCodes: backupCodes.map(hashBackupCode) } }
  );
  return { ok: true, backupCodes };
}

export async function disableTwoFactor(subject: string): Promise<void> {
  await connectMongoDB();
  await TwoFactor.deleteOne({ _id: subject });
}

/**
 * Marks a login challenge as answered. The predicate and the write are one
 * atomic operation, so of two concurrent attempts with the same challenge
 * exactly one wins; the loser is told to sign in again. Returns false when the
 * challenge was already used, is unknown, or the account no longer exists —
 * all of which mean "start over".
 */
export async function consumeChallenge(subject: string, challengeId?: string): Promise<boolean> {
  if (!challengeId) return false;
  await connectMongoDB();
  const result = await TwoFactor.updateOne(
    { _id: subject, usedChallenges: { $ne: challengeId } },
    { $push: { usedChallenges: { $each: [challengeId], $slice: -20 } } }
  );
  return (result.matchedCount ?? 0) > 0;
}
