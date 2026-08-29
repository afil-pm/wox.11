"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, ArrowLeft, Copy, Check, MessageCircle, X, Send, Loader2, Inbox, Clock, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusMessage {
  _id: string;
  senderEmail: string;
  senderName: string;
  message: string;
  status: "pending" | "reviewing" | "resolved" | "rejected" | "received";
  adminReply: string;
  keyDeliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  received: "bg-zinc-100 text-zinc-600",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  resolved: "Resolved",
  rejected: "Rejected",
  received: "Received",
};

type PanelView = "menu" | "send" | "sent" | "check" | "results";

function RecoveryPanel({ onClose, onFlowBlocked }: { onClose: () => void; onFlowBlocked?: (blocked: boolean) => void }) {
  const [view, setView] = useState<PanelView>("menu");

  // Send form state
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState("");

  // Check status state
  const [checkEmail, setCheckEmail] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [checkResults, setCheckResults] = useState<StatusMessage[]>([]);
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [receivedIds, setReceivedIds] = useState<Set<string>>(new Set());
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (!onFlowBlocked) return;
    const hasActiveFlow = checkResults.some(
      (msg) => msg.adminReply && !submittedIds.has(msg._id)
    );
    onFlowBlocked(hasActiveFlow);
  }, [checkResults, submittedIds, onFlowBlocked]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSendError("");
    setSendLoading(true);

    try {
      const res = await fetch("/api/messages/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderEmail, senderName, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "Failed to send request");
        return;
      }

      setView("sent");
    } catch {
      setSendError("Something went wrong. Please try again.");
    } finally {
      setSendLoading(false);
    }
  }

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setCheckError("");
    setCheckLoading(true);

    try {
      const res = await fetch(`/api/messages/status?email=${encodeURIComponent(checkEmail.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setCheckError(data.error || "Failed to check status");
        return;
      }

      setCheckResults(data.messages || []);
      setView("results");
    } catch {
      setCheckError("Something went wrong. Please try again.");
    } finally {
      setCheckLoading(false);
    }
  }

  function copyRecoveryKey(msgId: string, key: string) {
    navigator.clipboard.writeText(key);
    setCopiedKeys((prev) => new Set([...prev, msgId]));
  }

  async function confirmReceipt(msgId: string) {
    setConfirmingId(msgId);
    try {
      const res = await fetch("/api/messages/confirm-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId, senderEmail: checkEmail.trim() }),
      });

      if (res.ok) {
        setReceivedIds((prev) => new Set([...prev, msgId]));
      }
    } catch {
      // silently fail
    } finally {
      setConfirmingId(null);
    }
  }

  async function submitReceipt(msgId: string) {
    setSubmittingId(msgId);
    try {
      const res = await fetch("/api/messages/submit-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId, senderEmail: checkEmail.trim() }),
      });

      if (res.ok) {
        setSubmittedIds((prev) => new Set([...prev, msgId]));
      }
    } catch {
      // silently fail
    } finally {
      setSubmittingId(null);
    }
  }

  // Menu view
  if (view === "menu") {
    return (
      <div>
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-zinc-700" />
            <h3 className="font-bold text-zinc-900">Need Help?</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Choose an option below to get help with your account.
          </p>
          <button
            onClick={() => setView("send")}
            className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:bg-zinc-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                <Send className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">Send Recovery Request</p>
                <p className="text-xs text-zinc-500">Lost access? Send a message to the admin</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setView("check")}
            className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:bg-zinc-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                <Inbox className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">Check Request Status</p>
                <p className="text-xs text-zinc-500">See admin replies to your request</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Send view
  if (view === "send") {
    return (
      <form onSubmit={handleSend} className="flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setView("menu")} className="text-zinc-400 hover:text-zinc-600">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="font-bold text-zinc-900">Send Recovery Request</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Provide enough detail so the admin can verify you are the legitimate account owner.
          </p>

          {sendError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{sendError}</div>
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
              placeholder="E.g., registered email, approximate account creation date, any orders you remember..."
            />
            <p className="mt-1 text-[11px] text-zinc-400">10-2000 characters</p>
          </div>
        </div>

        <div className="border-t border-zinc-200 px-5 py-4">
          <Button
            type="submit"
            disabled={sendLoading}
            className="w-full bg-zinc-900 text-white hover:bg-zinc-800 gap-2"
          >
            {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sendLoading ? "Sending..." : "Send Recovery Request"}
          </Button>
        </div>
      </form>
    );
  }

  // Sent confirmation view
  if (view === "sent") {
    return (
      <div>
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="font-bold text-zinc-900">Request Sent</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-6 space-y-4 text-center">
          <p className="text-sm text-zinc-500 leading-relaxed">
            Your account recovery request has been received. The admin will review your case and reply soon.
          </p>
          <p className="text-xs text-zinc-400">
            Use <strong>{senderEmail}</strong> to check the status anytime.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => { setCheckEmail(senderEmail); setView("check"); }}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Inbox className="h-4 w-4" />
              Check Status
            </Button>
            <Button onClick={onClose} className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check status view
  if (view === "check") {
    return (
      <form onSubmit={handleCheck} className="flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setView("menu")} className="text-zinc-400 hover:text-zinc-600">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="font-bold text-zinc-900">Check Request Status</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Enter the email you used to send the recovery request to see admin replies.
          </p>

          {checkError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{checkError}</div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">Your Email</label>
            <input
              type="email"
              value={checkEmail}
              onChange={(e) => setCheckEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="border-t border-zinc-200 px-5 py-4">
          <Button
            type="submit"
            disabled={checkLoading}
            className="w-full bg-zinc-900 text-white hover:bg-zinc-800 gap-2"
          >
            {checkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Inbox className="h-4 w-4" />}
            {checkLoading ? "Checking..." : "Check Status"}
          </Button>
        </div>
      </form>
    );
  }

  // Results view
  if (view === "results") {
    const hasActiveFlow = checkResults.some(
      (msg) => msg.adminReply && !submittedIds.has(msg._id)
    );

    return (
      <div>
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setView("check")} className="text-zinc-400 hover:text-zinc-600">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="font-bold text-zinc-900">Your Requests</h3>
          </div>
          {hasActiveFlow ? (
            <span className="text-[11px] text-zinc-400">Complete all steps to close</span>
          ) : (
            <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-3">
          {checkResults.length === 0 ? (
            <div className="text-center py-6">
              <Inbox className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm text-zinc-500">No requests found for this email.</p>
            </div>
          ) : (
            checkResults.map((msg) => (
              <div key={msg._id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={cn("text-[10px]", statusStyles[msg.status])}>
                    {statusLabels[msg.status]}
                  </Badge>
                  <span className="text-[11px] text-zinc-400 whitespace-nowrap flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 mb-3 line-clamp-2">{msg.message}</p>

                {msg.adminReply ? (
                  <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3">
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Admin Reply</p>
                    <p className="text-sm text-zinc-800 whitespace-pre-wrap">{msg.adminReply}</p>

                    {!submittedIds.has(msg._id) && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-amber-600" />
                          <p className="text-xs font-semibold text-amber-800">
                            {!copiedKeys.has(msg._id)
                              ? "Step 1 — Copy Recovery Key"
                              : !receivedIds.has(msg._id)
                                ? "Step 2 — Confirm Received"
                                : "Step 3 — Submit to Close"}
                          </p>
                        </div>
                        <p className="text-[11px] text-amber-700 mb-3">
                          {!copiedKeys.has(msg._id)
                            ? "Copy the recovery key above to proceed."
                            : !receivedIds.has(msg._id)
                              ? "Click Received to confirm you have saved the key."
                              : "Click Submit to complete the process."}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={copiedKeys.has(msg._id) ? "default" : "outline"}
                            className={copiedKeys.has(msg._id) ? "bg-green-600 text-white hover:bg-green-700 gap-1.5" : "gap-1.5"}
                            onClick={() => copyRecoveryKey(msg._id, msg.adminReply)}
                          >
                            {copiedKeys.has(msg._id) ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedKeys.has(msg._id) ? "Copied" : "Copy Recovery Key"}
                          </Button>
                          {copiedKeys.has(msg._id) && !receivedIds.has(msg._id) && (
                            <Button
                              size="sm"
                              disabled={confirmingId === msg._id}
                              className="bg-zinc-900 text-white hover:bg-zinc-800 gap-1.5"
                              onClick={() => confirmReceipt(msg._id)}
                            >
                              {confirmingId === msg._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Received
                            </Button>
                          )}
                          {receivedIds.has(msg._id) && !submittedIds.has(msg._id) && (
                            <Button
                              size="sm"
                              disabled={submittingId === msg._id}
                              className="bg-zinc-900 text-white hover:bg-zinc-800 gap-1.5"
                              onClick={() => submitReceipt(msg._id)}
                            >
                              {submittingId === msg._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Submit
                            </Button>
                          )}
                          {submittedIds.has(msg._id) && (
                            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                              <Check className="h-3.5 w-3.5" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : msg.status === "pending" ? (
                  <p className="text-xs text-zinc-400 italic">Waiting for admin review...</p>
                ) : msg.status === "reviewing" ? (
                  <p className="text-xs text-blue-500 italic">Admin is reviewing your request...</p>
                ) : msg.status === "rejected" ? (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-xs text-red-600">This request was not approved. If you believe this is an error, please send a new request with more details.</p>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-zinc-200 px-5 py-3">
          <div className="flex gap-3">
            <Button
              onClick={() => setView("send")}
              variant="outline"
              className="flex-1 gap-2 text-sm"
              size="sm"
            >
              <Send className="h-3.5 w-3.5" />
              New Request
            </Button>
            <Button
              onClick={onClose}
              disabled={hasActiveFlow}
              className={cn(
                "flex-1 text-sm",
                hasActiveFlow
                  ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
              )}
              size="sm"
            >
              {hasActiveFlow ? "Complete All Steps" : "Close"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
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
  const [flowBlocked, setFlowBlocked] = useState(false);

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
                disabled={!copied}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
              >
                {copied ? "Sign In with New Password" : "Copy Recovery Code to Continue"}
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
          onClick={() => { if (!flowBlocked) setShowPanel(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-2xl sm:mr-8"
            onClick={(e) => e.stopPropagation()}
          >
            <RecoveryPanel
              onClose={() => setShowPanel(false)}
              onFlowBlocked={setFlowBlocked}
            />
          </div>
        </div>
      )}
    </div>
  );
}
