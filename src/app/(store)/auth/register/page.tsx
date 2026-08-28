"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus, Download, Shield, AlertTriangle, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [warningDismissCount, setWarningDismissCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const downloadTriggered = useRef(false);

  function generateCredentialFile() {
    const content = `═══════════════════════════════════════════
        WOX.11 — ACCOUNT CREDENTIALS
═══════════════════════════════════════════

  Name:     ${name}
  Email:    ${email}
${phone ? `  Phone:    ${phone}` : ""}

───────────────────────────────────────────
  RECOVERY CODE (keep this secret):
  ${recoveryCode}
───────────────────────────────────────────

  ⚠ IMPORTANT:
  • Your password is encrypted and cannot be recovered.
  • Use this recovery code only if you lose access.
  • Store this file in a secure password manager.
  • Never share this file with anyone.

───────────────────────────────────────────

  Generated: ${new Date().toLocaleString("en-IN")}
  Store:     WOX.11 (wox11.vercel.app)

═══════════════════════════════════════════`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wox11-credentials-${email.replace(/[^a-z0-9]/gi, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setShowWarning(false);
  }

  useEffect(() => {
    if (registered && !downloaded && !downloadTriggered.current) {
      downloadTriggered.current = true;
      setTimeout(() => generateCredentialFile(), 500);
    }
  }, [registered, downloaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setRecoveryCode(data.recoveryCode || "");
      localStorage.setItem("wox-user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-change"));
      setRegistered(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  function handleContinue() {
    if (!downloaded) {
      if (warningDismissCount < 3) {
        setShowWarning(true);
      } else {
        setWarningDismissed(true);
        router.push("/account");
      }
      return;
    }
    router.push("/account");
  }

  function handleDismissWarning() {
    const newCount = warningDismissCount + 1;
    setWarningDismissCount(newCount);
    setShowWarning(false);
    if (newCount >= 3) {
      setWarningDismissed(true);
    }
  }

  if (registered) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Account Created!</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Your credentials file has been downloaded. Save it somewhere safe.
            </p>

            {showWarning && !downloaded && (
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-left">
                    {warningDismissCount === 0 && (
                      <>
                        <p className="text-sm font-medium text-amber-800">Please save your credentials</p>
                        <p className="mt-1 text-xs text-amber-700">
                          Your password is encrypted and cannot be recovered. Download the file now to keep your account safe.
                        </p>
                      </>
                    )}
                    {warningDismissCount === 1 && (
                      <>
                        <p className="text-sm font-medium text-amber-800">This is important — download recommended</p>
                        <p className="mt-1 text-xs text-amber-700">
                          Without your credentials file, you may lose access to your account permanently. We strongly recommend downloading it now.
                        </p>
                      </>
                    )}
                    {warningDismissCount === 2 && (
                      <>
                        <p className="text-sm font-medium text-amber-800">Final reminder — your account security matters</p>
                        <p className="mt-1 text-xs text-amber-700">
                          This is the last time we will remind you. After this, you can continue without downloading, but your account cannot be recovered if you lose access.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {!downloaded ? (
                <Button
                  onClick={generateCredentialFile}
                  className="w-full bg-zinc-900 text-white hover:bg-zinc-800 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Credentials File
                </Button>
              ) : (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  File downloaded successfully
                </div>
              )}

              {downloaded ? (
                <Button
                  onClick={() => router.push("/account")}
                  className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  Continue to My Account
                </Button>
              ) : warningDismissed ? (
                <Button
                  onClick={() => router.push("/account")}
                  variant="outline"
                  className="w-full"
                >
                  Continue Without Downloading
                </Button>
              ) : (
                <Button
                  onClick={handleContinue}
                  variant="outline"
                  className="w-full"
                >
                  {warningDismissCount < 3
                    ? `Skip Download (${3 - warningDismissCount} warning${3 - warningDismissCount !== 1 ? "s" : ""} left)`
                    : "Continue to My Account"}
                </Button>
              )}
            </div>

            {recoveryCode && (
              <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="h-4 w-4 text-zinc-600" />
                  <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Recovery Code</span>
                </div>
                <p className="font-mono text-sm text-zinc-900 break-all">{recoveryCode}</p>
                <p className="mt-2 text-[11px] text-zinc-500">
                  Keep this code secret. Use it only if you lose access to your account.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Create Account</h1>
            <p className="mt-2 text-sm text-zinc-500">Join WOX.11 for exclusive deals</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Password is encrypted. You will receive a recovery file to save.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Create Account
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
