"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type Searcher = {
  userId: string | null;
  name: string;
  at: string;
};

type SearchLog = {
  id: string;
  query: string;
  display: string;
  count: number;
  firstAt: string;
  lastAt: string;
  notifiedCount: number;
  searchers: Searcher[];
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function AdminSearchLogsPage() {
  const [logs, setLogs] = useState<SearchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminFetch("/api/wox/admin/search-logs")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setLogs(Array.isArray(data.logs) ? data.logs : []);
      })
      .catch(() => {
        if (!cancelled) setLogs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) => log.display.toLowerCase().includes(term));
  }, [logs, filter]);

  const totalSearches = logs.reduce((sum, log) => sum + (log.count || 0), 0);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">404 Search Results</h1>
          <p className="text-sm text-gray-500">
            Searches that returned nothing — what shoppers want but the store does not carry.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">{totalSearches}</p>
          <p className="text-xs uppercase tracking-wide text-gray-400">Empty searches</p>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="mb-4 max-w-sm">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter searches..."
          />
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <SearchX className="mx-auto mb-4 h-12 w-12" />
          <p>No empty searches recorded yet</p>
          <p className="mt-1 text-sm">Queries that find nothing will show up here.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p>No searches match &ldquo;{filter}&rdquo;</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left font-medium">Search Term</th>
                <th className="p-3 text-left font-medium">Searches</th>
                <th className="p-3 text-left font-medium">Shoppers</th>
                <th className="p-3 text-left font-medium">First Seen</th>
                <th className="p-3 text-left font-medium">Last Seen</th>
                <th className="p-3 text-right font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((log) => {
                const open = expanded === log.id;
                const uniqueShoppers = new Set(
                  log.searchers.map((s) => s.userId || `anon:${s.at}`)
                ).size;
                return (
                  <tr key={log.id} className="border-t align-top">
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : log.id)}
                        className="text-left font-medium text-gray-900 hover:text-black"
                      >
                        &ldquo;{log.display}&rdquo;
                      </button>
                    </td>
                    <td className="p-3">{log.count}</td>
                    <td className="p-3">{uniqueShoppers}</td>
                    <td className="p-3 text-gray-500">{timeAgo(log.firstAt)}</td>
                    <td className="p-3 text-gray-500">{timeAgo(log.lastAt)}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : log.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                        aria-expanded={open}
                      >
                        {open ? "Hide" : "Show"}
                        {open ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visible.map((log) => {
                if (expanded !== log.id) return null;
                return (
                  <tr key={`${log.id}-detail`} className="border-t bg-gray-50/70">
                    <td colSpan={6} className="p-4">
                      <div className="rounded-md border bg-white p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Who searched for &ldquo;{log.display}&rdquo;
                          </p>
                          <p className="text-xs text-gray-400">
                            {log.notifiedCount > 0
                              ? `${log.notifiedCount} shopper${log.notifiedCount === 1 ? "" : "s"} notified of a match`
                              : "No matching product has shipped yet"}
                          </p>
                        </div>
                        {log.searchers.length === 0 ? (
                          <p className="text-sm text-gray-400">Anonymous searches only.</p>
                        ) : (
                          <ul className="max-h-56 divide-y overflow-y-auto text-sm">
                            {log.searchers.map((s, i) => (
                              <li
                                key={`${s.userId || "anon"}-${i}`}
                                className="flex items-center justify-between py-1.5"
                              >
                                <span className="truncate pr-3 text-gray-700">
                                  {s.name || s.userId || "Anonymous shopper"}
                                  {s.name && s.userId ? (
                                    <span className="ml-2 text-xs text-gray-400">{s.userId}</span>
                                  ) : null}
                                </span>
                                <span className={cn("shrink-0 text-xs text-gray-400")}>
                                  {timeAgo(s.at)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
