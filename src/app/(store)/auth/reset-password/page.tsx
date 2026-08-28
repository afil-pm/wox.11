"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, ArrowLeft, Copy, Check, MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function RecoveryPanel({ onClose }: { onClose: () => void }) {
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/messages/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderEmail, senderName, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send request");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center py-8 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">Request Sent</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Your account recovery request has been received. The admin will review your case and contact you if needed.
        </p>
        <Button onClick={onClose} variant="outline" className="mt-6 w-full">
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSend} className="flex flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-zinc-700" />
          <h3 className="font-bold text-zinc-900">Contact Admin</h3>
        </div>
        <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <p className="text-xs text-zinc-500 leading-relaxed">
          Lost access to your password and recovery code? Send a request to the admin. Provide enough detail so the admin can verify you are the legitimate account owner.
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Your Email</label>
          <input
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Your Name</label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"
            placeholder="Explain your situation. E.g., registered email, approximate account creation date, any orders you remember..."
          />
          <p className="mt-1 text-[11px] text-zinc-400">10-2000 characters</p>
        </div>
      </div>

      <div className="border-t border-zinc-200 px-5 py-4">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 text-white hover:bg-zinc-800 gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {loading ? "Sending..." : "Send Recovery Request"}
        </Button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newRecoveryCode, setNewRecoveryCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recoveryCode, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Password reset failed");
        return;
      }

      setNewRecoveryCode(data.recoveryCode || "");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  function copyRecoveryCode() {
    navigator.clipboard.writeText(newRecoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Password Reset!</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Your password has been updated. Save your new recovery code.
            </p>

            {newRecoveryCode && (
              <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-zinc-600" />
                    <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">New Recovery Code</span>
                  </div>
                  <button
                    onClick={copyRecoveryCode}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="font-mono text-sm text-zinc-900 break-all bg-white rounded-lg border border-zinc-200 p-3">{newRecoveryCode}</p>
                <p className="mt-2 text-[11px] text-zinc-500">
                  Your old recovery code is no longer valid. Keep this new one safe.
                </p>
              </div>
            )}

            <div className="mt-6">
              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Sign In with New Password
              </Button>
            </div>
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <KeyRound className="h-6 w-6 text-zinc-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Reset Password</h1>
            <p className="mt-2 text-sm text-zinc-500">Enter your recovery code to set a new password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

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
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Recovery Code</label>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Resetting password...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> Reset Password
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link href="/auth/login" className="inline-flex items-center gap-1 font-medium text-zinc-900 underline-offset-4 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Floating Contact Admin Button */}
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl lg:bottom-8 lg:right-8"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Contact Admin Panel */}
      {showPanel && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-end bg-black/40 p-4 sm:items-center sm:justify-end"
          onClick={() => setShowPanel(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-2xl sm:mr-8 animate-in slide-in-from-bottom-4 sm:slide-in-from-right-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <RecoveryPanel onClose={() => setShowPanel(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
