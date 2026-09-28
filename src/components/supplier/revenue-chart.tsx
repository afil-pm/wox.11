"use client";

import { cn } from "@/lib/utils";

export interface ChartPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  units: number;
}

/**
 * Dependency free bar chart (the repo ships no charting library): revenue per
 * period, responsive, with a native tooltip per bar and a horizontally
 * scrollable track so long ranges stay readable on a phone.
 */
export default function RevenueChart({
  points,
  height = 180,
  emptyMessage = "No sales in this period yet.",
  formatValue = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`,
}: {
  points: ChartPoint[];
  height?: number;
  emptyMessage?: string;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...points.map((point) => point.revenue));
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-zinc-200 text-sm text-zinc-400"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
        <span>0</span>
        <span>{formatValue(max)}</span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div
          className="flex min-w-full items-end gap-1 rounded-lg bg-zinc-50 px-2 pt-2"
          style={{ height }}
        >
          {points.map((point, index) => {
            const ratio = point.revenue / max;
            const barHeight = point.revenue > 0 ? Math.max(ratio * 100, 3) : 1.5;
            return (
              <div
                key={`${point.date}-${index}`}
                className="group relative flex h-full min-w-[14px] flex-1 flex-col justify-end"
                title={`${point.label}: ${formatValue(point.revenue)} · ${point.orders} order${
                  point.orders === 1 ? "" : "s"
                }`}
              >
                <span className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white group-hover:block">
                  {point.label} · {formatValue(point.revenue)}
                </span>
                <div
                  className={cn(
                    "w-full rounded-t transition-colors",
                    point.revenue > 0
                      ? "bg-zinc-900 group-hover:bg-emerald-500"
                      : "bg-zinc-200/70"
                  )}
                  style={{ height: `${barHeight}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex gap-1 overflow-hidden">
        {points.map((point, index) => (
          <span
            key={`label-${point.date}-${index}`}
            className="min-w-[14px] flex-1 text-center text-[9px] leading-tight text-zinc-400"
          >
            {index % labelEvery === 0 ? point.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
