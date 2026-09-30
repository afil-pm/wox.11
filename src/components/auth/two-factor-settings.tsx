"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, KeyRound, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Phase = "idle" | "enrol" | "backups" | "disable";

/**
 * Enrolment and removal for the second factor. The QR code and the secret come
 * from the server (rendered there, so the TOTP library never ships to the
 * browser), and the codes are only ever shown once — immediately after the
 * first successful confirmation.
 */
export default function TwoFactorSettings() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/2fa/status");
      if (res.ok) {
        const data = await res.json();
        setEnabled(Boolean(data.enabled));
      }
    } catch {
      // Leave the last known state; the controls stay usable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function reset() {
    setPhase("idle");
    setCode("");
    setError("");
    setQr("");
    setSecret("");
    setOtpauthUrl("");
  }

  async function startEnrolment() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start setup");
      setQr(data.qrDataUrl);
      setSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl);
      setPhase("enrol");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start setup");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnrolment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That code is not valid");
      setBackupCodes(data.backupCodes || []);
      setEnabled(true);
      setPhase("backups");
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code is not valid");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That code is not valid");
      setEnabled(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code is not valid");
    } finally {
      setBusy(false);
    }
  }

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be denied; the codes stay visible on screen.
    }
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading security settings...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Two-Factor Authentication</h3>
        </div>
        <span
          className={
            enabled
              ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
              : "rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500"
          }
        >
          {enabled ? "On" : "Off"}
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Ask for a 6-digit code from your authenticator app in addition to your password.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {phase === "idle" && !enabled && (
        <div className="mt-4">
          <p className="text-sm text-zinc-600">
            Turn this on and a stolen password alone will not be enough to sign in to your account.
          </p>
          <Button
            onClick={startEnrolment}
            disabled={busy}
            className="mt-4 bg-zinc-900 text-white hover:bg-zinc-800"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}
            Turn on two-factor
          </Button>
        </div>
      )}

      {phase === "enrol" && (
        <form onSubmit={confirmEnrolment} className="mt-4 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* data URL rendered by the server, no remote source */}
            {qr && (
              <img src={qr} alt="Two-factor enrolment QR code" className="h-40 w-40 rounded-lg border border-zinc-200" />
            )}
            <div className="text-sm text-zinc-600">
              <p>1. Scan this code with Google Authenticator, Authy, 1Password or similar.</p>
              <p className="mt-2">2. Can&apos;t scan? Enter this key manually:</p>
              <p className="mt-1 break-all rounded-lg bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800">{secret}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600">3. Enter the 6-digit code it shows</label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              placeholder="000000"
              className="mt-1 text-center tracking-[0.3em]"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={busy || code.trim().length !== 6} className="bg-zinc-900 text-white hover:bg-zinc-800">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirm and turn on
            </Button>
            <Button type="button" variant="outline" onClick={reset} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {phase === "backups" && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Save these backup codes somewhere safe. Each one works once if you lose access to your
            authenticator app — they will not be shown again.
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((c) => (
              <code key={c} className="rounded-lg bg-zinc-50 px-3 py-2 text-center font-mono text-sm text-zinc-800">
                {c}
              </code>
            ))}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={copyCodes}>
              {copied ? "Copied" : "Copy codes"}
            </Button>
            <Button type="button" onClick={reset} className="bg-zinc-900 text-white hover:bg-zinc-800">
              I&apos;ve saved them
            </Button>
          </div>
        </div>
      )}

      {phase === "idle" && enabled && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" /> Two-factor authentication is active on this account.
          </div>
          <Button variant="outline" className="mt-4 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setPhase("disable")}>
            Turn off
          </Button>
        </div>
      )}

      {phase === "disable" && (
        <form onSubmit={confirmDisable} className="mt-4 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
              <KeyRound className="h-3.5 w-3.5" /> Enter a current code to switch this off
            </label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={16}
              placeholder="000000 or backup code"
              className="mt-1 text-center tracking-[0.3em]"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={busy || code.trim().length < 6} className="bg-zinc-900 text-white hover:bg-zinc-800">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Turn off"}
            </Button>
            <Button type="button" variant="outline" onClick={reset} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
