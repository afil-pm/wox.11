"use client";

import { useCallback, useEffect, useState } from "react";
import { IndianRupee, ShoppingCart, TrendingUp, Package, CalendarDays } from "lucide-react";
import WoxLoader from "@/components/ui/wox-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supplierFetch } from "@/lib/supplier-api";
import { cn, formatPrice } from "@/lib/utils";
import RevenueChart, { ChartPoint } from "@/components/supplier/revenue-chart";

type RangeKey =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "week"
  | "month"
  | "lastmonth"
  | "year"
  | "custom";

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "lastmonth", label: "Last month" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom" },
];

interface AnalyticsResponse {
  range: { key: RangeKey; from: string | null; to: string | null; label: string };
  bucket: "day" | "week" | "month";
  summary: { revenue: number; orders: number; units: number; aov: number };
  series: ChartPoint[];
  topProducts: Array<{ slug: string; name: string; units: number; revenue: number; orders: number }>;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
        <Icon className="h-4 w-4 text-zinc-400" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

export default function SupplierAnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pendingFrom, setPendingFrom] = useState("");
  const [pendingTo, setPendingTo] = useState("");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (key: RangeKey, start: string, end: string) => {
    setLoading(true);
    setError("");
    try {
      const tzOffset = -new Date().getTimezoneOffset();
      const params = new URLSearchParams({ range: key, tzOffset: String(tzOffset) });
      if (key === "custom") {
        if (start) params.set("from", start);
        if (end) params.set("to", end);
      }
      const res = await supplierFetch(`/api/wox/supplier/analytics?${params.toString()}`);
      const json = await res.json();
      if (json?.error && !json.summary) {
        setError(json.error);
        setData(null);
        return;
      }
      setData(json);
      setFrom(start);
      setTo(end);
    } catch {
      setError("Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range, pendingFrom, pendingTo);
    // Only when the preset changes; custom windows apply through the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const applyCustom = () => {
    if (!pendingFrom && !pendingTo) return;
    load("custom", pendingFrom, pendingTo);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Revenue Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Revenue and orders from your own products only.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setRange(option.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                range === option.key
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {range === "custom" && (
          <div className="mt-3 flex flex-col gap-3 border-t border-zinc-100 pt-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-500">From</label>
              <Input
                type="date"
                value={pendingFrom}
                onChange={(e) => setPendingFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-500">To</label>
              <Input type="date" value={pendingTo} onChange={(e) => setPendingTo(e.target.value)} />
            </div>
            <Button type="button" size="sm" onClick={applyCustom} disabled={!pendingFrom && !pendingTo}>
              Apply range
            </Button>
          </div>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {loading && !data ? (
        <div className="flex h-64 items-center justify-center">
          <WoxLoader />
        </div>
      ) : data ? (
        <>
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm text-zinc-500">
              <CalendarDays className="h-4 w-4" />
              {data.range.label}
              {data.range.from && data.range.to
                ? ` · ${new Date(data.range.from).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })} – ${new Date(data.range.to).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}`
                : ""}
            </p>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <SummaryCard label="Revenue" value={formatPrice(data.summary.revenue)} icon={IndianRupee} />
              <SummaryCard label="Orders" value={data.summary.orders} icon={ShoppingCart} />
              <SummaryCard label="Avg. order value" value={formatPrice(data.summary.aov)} icon={TrendingUp} />
              <SummaryCard label="Units sold" value={data.summary.units} icon={Package} />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-900">
                Revenue by {data.bucket === "day" ? "day" : data.bucket === "week" ? "week" : "month"}
              </h2>
            </div>
            <RevenueChart
              points={data.series}
              height={220}
              emptyMessage="No sales in this period yet."
            />
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-900">Top products</h2>
            </div>
            {data.topProducts.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-500">No sales in this period yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase text-zinc-500">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Units</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.topProducts.map((product) => (
                      <tr key={product.slug} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{product.name}</td>
                        <td className="px-4 py-3 text-zinc-600">{product.orders}</td>
                        <td className="px-4 py-3 text-zinc-600">{product.units}</td>
                        <td className="px-4 py-3 text-right font-medium text-zinc-900">
                          {formatPrice(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
