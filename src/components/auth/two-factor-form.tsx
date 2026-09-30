"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface TwoFactorFormProps {
  twoFactorToken: string;
  onAuthenticated: (user: Record<string, unknown>) => void;
  onCancel?: () => void;
}

/**
 * Second step of a login whose password already verified. Sits in place of the
 * password form, swaps the challenge token for a real session, and hands the
 * resulting user back to whichever login page rendered it.
 */
export default function TwoFactorForm({ twoFactorToken, onAuthenticated, onCancel }: TwoFactorFormProps) {
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorToken, code: code.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid authentication code.");
        return;
      }

      onAuthenticated(data.user);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          {useBackup ? "Backup code" : "Authentication code"}
        </label>
        <input
          type="text"
          inputMode={useBackup ? "text" : "numeric"}
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          maxLength={useBackup ? 16 : 6}
          autoFocus
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-lg tracking-[0.35em] text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          placeholder={useBackup ? "XXXX-XXXX" : "000000"}
        />
        <p className="mt-2 text-xs text-zinc-500">
          {useBackup
            ? "Enter one of the single-use codes you saved when you turned this on."
            : "Open your authenticator app and enter the 6-digit code for WOX.11."}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
          </>
        ) : (
          "Verify"
        )}
      </button>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <button
          type="button"
          onClick={() => {
            setUseBackup(!useBackup);
            setCode("");
            setError("");
          }}
          className="underline underline-offset-4 hover:text-zinc-800"
        >
          {useBackup ? "Use an authentication code" : "Use a backup code"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="underline underline-offset-4 hover:text-zinc-800"
          >
            Back
          </button>
        )}
      </div>
    </form>
  );
}
