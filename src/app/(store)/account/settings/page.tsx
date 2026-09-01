"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Sun, Moon, HelpCircle, MessageSquare, Bug, Send, Loader2, CheckCircle, CreditCard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignOutStore } from "@/lib/stores/sign-out";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export default function AccountSettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const openSignOut = useSignOutStore((s) => s.open);
  const { theme, setTheme } = useTheme();

  const [helpType, setHelpType] = useState<"help-support" | "feedback" | "bug-report">("help-support");
  const [helpMessage, setHelpMessage] = useState("");
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpStatus, setHelpStatus] = useState<"idle" | "success" | "error">("idle");
  const [helpError, setHelpError] = useState("");

  const [bankLoading, setBankLoading] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankHasDetails, setBankHasDetails] = useState(false);
  const [bankEditing, setBankEditing] = useState(false);
  const [bankStatus, setBankStatus] = useState<"idle" | "success" | "error">("idle");
  const [bankError, setBankError] = useState("");
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("wox-user");
    if (stored) {
      const user = JSON.parse(stored);
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("wox-user") || "{}");
    if (!user?.id) return;
    setBankLoading(true);
    fetch("/api/saved-bank-details", {
      headers: { "x-user-id": user.id },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.bankDetails) {
          setBankHasDetails(true);
          setBankForm({
            accountHolderName: data.bankDetails.accountHolderName || "",
            accountNumber: "",
            confirmAccountNumber: "",
            ifscCode: data.bankDetails.ifscCode || "",
            bankName: data.bankDetails.bankName || "",
            upiId: data.bankDetails.upiId || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setBankLoading(false));
  }, []);

  function handleSave() {
    const stored = localStorage.getItem("wox-user");
    if (stored) {
      const user = JSON.parse(stored);
      user.name = name;
      user.phone = phone;
      localStorage.setItem("wox-user", JSON.stringify(user));
      window.dispatchEvent(new Event("auth-change"));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleHelpSubmit() {
    if (!helpMessage.trim() || helpMessage.trim().length < 10) {
      setHelpError("Message must be at least 10 characters");
      return;
    }
    setHelpLoading(true);
    setHelpError("");
    setHelpStatus("idle");
    try {
      const stored = localStorage.getItem("wox-user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch("/api/messages/help-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: helpType,
          message: helpMessage.trim(),
          senderEmail: user?.email || email,
          senderName: user?.name || name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHelpError(data.error || "Failed to submit");
        setHelpStatus("error");
        return;
      }
      setHelpStatus("success");
      setHelpMessage("");
      setTimeout(() => setHelpStatus("idle"), 4000);
    } catch {
      setHelpError("Network error. Please try again.");
      setHelpStatus("error");
    } finally {
      setHelpLoading(false);
    }
  }

  async function handleBankSave() {
    if (!bankForm.accountHolderName.trim() || !bankForm.ifscCode.trim() || !bankForm.bankName.trim()) {
      setBankError("Account holder name, IFSC code, and bank name are required");
      setBankStatus("error");
      return;
    }
    if (!bankHasDetails && !bankEditing) {
      if (!bankForm.accountNumber.trim()) {
        setBankError("Account number is required");
        setBankStatus("error");
        return;
      }
      if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
        setBankError("Account numbers do not match");
        setBankStatus("error");
        return;
      }
    }
    if (bankForm.ifscCode && !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(bankForm.ifscCode)) {
      setBankError("Invalid IFSC code format");
      setBankStatus("error");
      return;
    }
    const user = JSON.parse(localStorage.getItem("wox-user") || "{}");
    if (!user?.id) return;
    setBankSaving(true);
    setBankError("");
    setBankStatus("idle");
    try {
      const body: Record<string, string> = {
        accountHolderName: bankForm.accountHolderName.trim(),
        ifscCode: bankForm.ifscCode.toUpperCase().trim(),
        bankName: bankForm.bankName.trim(),
        upiId: bankForm.upiId.trim(),
      };
      if (!bankHasDetails || bankEditing) {
        body.accountNumber = bankForm.accountNumber;
      }
      const res = await fetch("/api/saved-bank-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setBankStatus("success");
      setBankHasDetails(true);
      setBankEditing(false);
      setBankForm((prev) => ({ ...prev, accountNumber: "", confirmAccountNumber: "" }));
      setTimeout(() => setBankStatus("idle"), 3000);
    } catch (err) {
      setBankError(err instanceof Error ? err.message : "Failed to save bank details");
      setBankStatus("error");
    } finally {
      setBankSaving(false);
    }
  }

  async function handleBankDelete() {
    const user = JSON.parse(localStorage.getItem("wox-user") || "{}");
    if (!user?.id) return;
    if (!confirm("Delete saved bank details?")) return;
    setBankLoading(true);
    try {
      const res = await fetch("/api/saved-bank-details", {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setBankHasDetails(false);
      setBankEditing(false);
      setBankForm({ accountHolderName: "", accountNumber: "", confirmAccountNumber: "", ifscCode: "", bankName: "", upiId: "" });
    } catch {
    } finally {
      setBankLoading(false);
    }
  }

  const helpTypes = [
    { key: "help-support" as const, label: "Help / Support", icon: HelpCircle, desc: "Get assistance with your account or orders" },
    { key: "feedback" as const, label: "Feedback", icon: MessageSquare, desc: "Share your thoughts about the website" },
    { key: "bug-report" as const, label: "Report a Problem", icon: Bug, desc: "Report bugs or technical issues" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/account" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Account Settings</h1>
      </div>

      {/* Profile Information */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Profile Information</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-600">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Email</label>
            <Input value={email} disabled className="mt-1 bg-zinc-50" />
            <p className="mt-1 text-xs text-zinc-400">Email cannot be changed</p>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" className="mt-1" />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} className="bg-zinc-900 text-white hover:bg-zinc-800">
            <Save className="mr-2 h-4 w-4" />
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Bank Details */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">Bank Details</h3>
          </div>
          {bankHasDetails && !bankEditing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setBankEditing(true)}>Edit</Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleBankDelete} disabled={bankLoading}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-500">Saved bank details for refund processing</p>

        {bankLoading ? (
          <p className="mt-4 text-sm text-zinc-400">Loading...</p>
        ) : bankHasDetails && !bankEditing ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-600">Account Holder</label>
                <p className="mt-1 text-sm text-zinc-900">{bankForm.accountHolderName || "-"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Bank Name</label>
                <p className="mt-1 text-sm text-zinc-900">{bankForm.bankName || "-"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">IFSC Code</label>
                <p className="mt-1 text-sm text-zinc-900 font-mono">{bankForm.ifscCode || "-"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">UPI ID</label>
                <p className="mt-1 text-sm text-zinc-900">{bankForm.upiId || "-"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-600">Account Holder Name</label>
                <Input value={bankForm.accountHolderName} onChange={(e) => setBankForm((p) => ({ ...p, accountHolderName: e.target.value }))} placeholder="Full name" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Bank Name</label>
                <Input value={bankForm.bankName} onChange={(e) => setBankForm((p) => ({ ...p, bankName: e.target.value }))} placeholder="e.g. SBI, HDFC" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-600">Account Number</label>
                <Input type="password" value={bankForm.accountNumber} onChange={(e) => setBankForm((p) => ({ ...p, accountNumber: e.target.value }))} placeholder={bankHasDetails ? "Enter to update" : "Account number"} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Confirm Account Number</label>
                <Input type="password" value={bankForm.confirmAccountNumber} onChange={(e) => setBankForm((p) => ({ ...p, confirmAccountNumber: e.target.value }))} placeholder="Confirm number" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-600">IFSC Code</label>
                <Input value={bankForm.ifscCode} onChange={(e) => setBankForm((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))} placeholder="e.g. SBIN0001234" className="mt-1 font-mono" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">UPI ID (optional)</label>
                <Input value={bankForm.upiId} onChange={(e) => setBankForm((p) => ({ ...p, upiId: e.target.value }))} placeholder="e.g. name@upi" className="mt-1" />
              </div>
            </div>

            {bankStatus === "success" && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" /> Bank details saved successfully.
              </div>
            )}
            {bankError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{bankError}</div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleBankSave} disabled={bankSaving} className="bg-zinc-900 text-white hover:bg-zinc-800">
                {bankSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {bankSaving ? "Saving..." : "Save Bank Details"}
              </Button>
              {bankEditing && (
                <Button variant="outline" onClick={() => { setBankEditing(false); setBankStatus("idle"); setBankError(""); }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Theme */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Appearance</h3>
        <p className="mt-1 text-xs text-zinc-500">Choose how the app looks on your device</p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center gap-3 rounded-xl border-2 px-5 py-3 text-sm font-medium transition-all",
              theme === "light"
                ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
            )}
          >
            <Sun className="h-5 w-5" />
            Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center gap-3 rounded-xl border-2 px-5 py-3 text-sm font-medium transition-all",
              theme === "dark"
                ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
            )}
          >
            <Moon className="h-5 w-5" />
            Dark
          </button>
        </div>
      </div>

      {/* Help & Feedback */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Help & Feedback</h3>
        <p className="mt-1 text-xs text-zinc-500">Get support, share feedback, or report issues</p>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {helpTypes.map((h) => (
            <button
              key={h.key}
              onClick={() => { setHelpType(h.key); setHelpStatus("idle"); setHelpError(""); }}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                helpType === h.key
                  ? "border-zinc-900 bg-zinc-50 shadow-sm"
                  : "border-zinc-200 hover:border-zinc-300"
              )}
            >
              <h.icon className={cn("h-5 w-5 flex-shrink-0", helpType === h.key ? "text-zinc-900" : "text-zinc-400")} />
              <div>
                <p className={cn("text-sm font-medium", helpType === h.key ? "text-zinc-900" : "text-zinc-600")}>{h.label}</p>
                <p className="text-[11px] text-zinc-400 hidden sm:block">{h.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-zinc-600">Your Message</label>
          <textarea
            value={helpMessage}
            onChange={(e) => { setHelpMessage(e.target.value); setHelpStatus("idle"); setHelpError(""); }}
            rows={4}
            placeholder={
              helpType === "help-support"
                ? "Describe how we can help you..."
                : helpType === "feedback"
                ? "Share your feedback or suggestions..."
                : "Describe the issue you're experiencing..."
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 resize-none"
          />
          <p className="mt-1 text-[11px] text-zinc-400">{helpMessage.length}/2000 characters</p>
        </div>

        {helpStatus === "success" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Message submitted successfully. We&apos;ll get back to you soon.
          </div>
        )}

        {helpError && (
          <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{helpError}</div>
        )}

        <div className="mt-4">
          <Button
            onClick={handleHelpSubmit}
            disabled={!helpMessage.trim() || helpLoading || helpMessage.trim().length < 10}
            className="bg-zinc-900 text-white hover:bg-zinc-800 gap-1.5"
          >
            {helpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {helpLoading ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Danger Zone</h3>
        <p className="mt-2 text-sm text-zinc-500">Sign out from your account on this device.</p>
        <Button
          variant="outline"
          className="mt-4 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => openSignOut()}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
