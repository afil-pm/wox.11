"use client";

import { useEffect, useState } from "react";
import { Check, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderSuccessProps {
  orderNumber: string;
}

export default function OrderSuccess({ orderNumber }: OrderSuccessProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 300);
    const t2 = setTimeout(() => setStage(2), 800);
    const t3 = setTimeout(() => setStage(3), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="flex flex-col items-center py-8 text-center">
      {/* Confetti burst */}
      <div className="relative mb-2">
        {/* Outer ring pulse */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-green-100 transition-all duration-700",
            stage >= 1 ? "scale-150 opacity-0" : "scale-100 opacity-60"
          )}
          style={{ width: 96, height: 96, top: -8, left: -8 }}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-green-50 transition-all duration-500 delay-200",
            stage >= 2 ? "scale-200 opacity-0" : "scale-100 opacity-40"
          )}
          style={{ width: 96, height: 96, top: -8, left: -8 }}
        />

        {/* Main circle */}
        <div
          className={cn(
            "relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500",
            stage >= 1
              ? "bg-gradient-to-br from-green-400 to-emerald-500 scale-100 shadow-lg shadow-green-200"
              : "bg-zinc-200 scale-0"
          )}
        >
          <Check
            className={cn(
              "h-10 w-10 text-white transition-all duration-300",
              stage >= 2 ? "stroke-[3] opacity-100" : "stroke-[2] opacity-0"
            )}
          />
        </div>

        {/* Orbiting dots */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "absolute h-2 w-2 rounded-full transition-all duration-500",
              stage >= 1 ? "opacity-100" : "opacity-0"
            )}
            style={{
              background: ["#22c55e", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"][i],
              top: "50%",
              left: "50%",
              transform: `rotate(${i * 60}deg) translateY(-52px) translateX(-50%)`,
              transitionDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>

      {/* Party popper */}
      <div
        className={cn(
          "transition-all duration-500",
          stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <PartyPopper className="mx-auto h-8 w-8 text-amber-500" />
      </div>

      {/* Title */}
      <h2
        className={cn(
          "mt-4 text-3xl font-bold tracking-tight transition-all duration-500",
          stage >= 2 ? "opacity-100 translate-y-0 text-zinc-900" : "opacity-0 translate-y-4"
        )}
      >
        Order Placed!
      </h2>

      {/* Subtitle */}
      <p
        className={cn(
          "mt-2 text-sm transition-all duration-500 delay-100",
          stage >= 3 ? "opacity-100 translate-y-0 text-zinc-500" : "opacity-0 translate-y-4"
        )}
      >
        Thank you for shopping with WOX.11
      </p>

      {/* Order badge */}
      <div
        className={cn(
          "mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-2 transition-all duration-500 delay-200",
          stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-semibold text-zinc-900">{orderNumber}</span>
      </div>

      {/* Shimmer line */}
      <div
        className={cn(
          "mt-6 h-px w-64 overflow-hidden rounded-full transition-all duration-700 delay-300",
          stage >= 3 ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="h-full w-full animate-gradient bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
      </div>
    </div>
  );
}
