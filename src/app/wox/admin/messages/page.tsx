"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, MessageSquare, Send, Loader2, HelpCircle, Bug, MessageCircle } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import WoxLoader from "@/components/ui/wox-loader";

interface Message {
  _id: string;
  type: string;
  senderEmail: string;
  senderName: string;
  message: string;
  status: "pending" | "reviewing" | "resolved" | "rejected" | "received" | "complete";
  adminReply: string;
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  received: "bg-zinc-100 text-zinc-600",
  complete: "bg-green-100 text-green-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  resolved: "Resolved",
  rejected: "Rejected",
  received: "Received",
  complete: "Complete",
};

const typeLabels: Record<string, string> = {
  "account-recovery": "Account Recovery",
  "help-support": "Help / Support",
  "feedback": "Feedback",
  "bug-report": "Bug Report",
};

const typeStyles: Record<string, string> = {
  "account-recovery": "bg-purple-100 text-purple-800",
  "help-support": "bg-blue-100 text-blue-800",
  "feedback": "bg-green-100 text-green-800",
  "bug-report": "bg-red-100 text-red-800",
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "account-recovery": MessageCircle,
  "help-support": HelpCircle,
  "feedback": MessageSquare,
  "bug-report": Bug,
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const url = statusFilter === "all" ? "/api/wox/admin/messages" : `/api/wox/admin/messages?status=${statusFilter}`;
      const res = await adminFetch(url);
      const data = await res.json();
      setMessages(data.messages || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (selectedMsg) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => modalRef.current?.scrollTo({ top: 0, behavior: "auto" }));
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedMsg]);

  async function updateStatus(id: string, newStatus: string) {
    try {
      await adminFetch(`/api/wox/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMessages();
      if (selectedMsg?._id === id) {
        setSelectedMsg((prev) => prev ? { ...prev, status: newStatus as Message["status"] } : null);
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  }

  async function sendReply() {
    if (!selectedMsg || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      await adminFetch(`/api/wox/admin/messages/${selectedMsg._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: replyText, status: "reviewing" }),
      });
      setReplyText("");
      fetchMessages();
      setSelectedMsg((prev) => prev ? { ...prev, adminReply: replyText, status: "reviewing" } : null);
    } catch (e) {
      console.error("Failed to send reply:", e);
    } finally {
      setReplyLoading(false);
    }
  }

  const filteredMessages = typeFilter === "all" ? messages : messages.filter((m) => m.type === typeFilter);
  const pendingCount = messages.filter((m) => m.status === "pending").length;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500">
            {filteredMessages.length} request(s) &middot; {pendingCount} pending &middot; Updated{" "}
            {lastUpdated.toLocaleTimeString("en-IN")}
          </p>
        </div>
      </div>

      {/* Type Filter */}
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Types" },
          { key: "account-recovery", label: "Account Recovery" },
          { key: "help-support", label: "Help / Support" },
          { key: "feedback", label: "Feedback" },
          { key: "bug-report", label: "Bug Report" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTypeFilter(t.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              typeFilter === t.key
                ? "bg-zinc-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "pending", "reviewing", "resolved", "rejected", "received", "complete"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              statusFilter === s
                ? "bg-zinc-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {s === "all" ? "All Status" : statusLabels[s]}
            {s === "pending" && pendingCount > 0 && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <WoxLoader />
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
          <MessageSquare className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No messages found</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMessages.map((msg) => {
                  const TypeIcon = typeIcons[msg.type] || MessageSquare;
                  return (
                    <tr key={msg._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{msg.senderName}</div>
                        <div className="text-xs text-gray-500">{msg.senderEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn(typeStyles[msg.type] || "bg-gray-100 text-gray-800")}>
                          <TypeIcon className="mr-1 h-3 w-3" />
                          {typeLabels[msg.type] || msg.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{msg.message}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn(statusStyles[msg.status])}>
                          {statusLabels[msg.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedMsg(msg); setReplyText(""); }}>
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMsg && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedMsg(null)}
        >
          <div
            ref={modalRef}
            className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-y-auto overscroll-contain rounded-xl bg-white shadow-xl"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{typeLabels[selectedMsg.type] || selectedMsg.type}</h2>
                  <Badge className={cn(typeStyles[selectedMsg.type] || "bg-gray-100 text-gray-800")}>
                    {typeLabels[selectedMsg.type]}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  From {selectedMsg.senderName} &middot; {new Date(selectedMsg.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button onClick={() => setSelectedMsg(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <p className="text-gray-900">{selectedMsg.senderName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-900">{selectedMsg.senderEmail}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Message</h3>
                <div className="rounded-lg border border-zinc-200 bg-white p-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedMsg.message}</p>
                </div>
              </div>

              {selectedMsg.adminReply && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Admin Reply</h3>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedMsg.adminReply}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {(["pending", "reviewing", "resolved", "rejected", "received", "complete"] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selectedMsg.status === s ? "default" : "outline"}
                      className={selectedMsg.status === s ? "bg-zinc-900 text-white" : ""}
                      onClick={() => updateStatus(selectedMsg._id, s)}
                    >
                      {statusLabels[s]}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Reply</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Type your reply to the user..."
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 resize-none"
                />
                <Button
                  size="sm"
                  className="mt-2 bg-zinc-900 text-white hover:bg-zinc-800 gap-1.5"
                  disabled={!replyText.trim() || replyLoading}
                  onClick={sendReply}
                >
                  {replyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {replyLoading ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
