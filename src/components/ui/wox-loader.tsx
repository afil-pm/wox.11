"use client";

import { cn } from "@/lib/utils";

export default function WoxLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6",
        className
      )}
    >
      {/* Animated WOX.11 text */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 280 60"
          className="h-16 w-[200px] sm:h-20 sm:w-[240px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="wox-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#18181b">
                <animate
                  attributeName="stop-color"
                  values="#18181b;#71717a;#18181b"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#18181b">
                <animate
                  attributeName="stop-color"
                  values="#18181b;#27272a;#18181b"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </defs>
          <text
            x="50%"
            y="50%"
            dominantBaseline="central"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="48"
            fontWeight="900"
            letterSpacing="-2"
            fill="none"
            stroke="url(#wox-gradient)"
            strokeWidth="1.5"
            style={{
              strokeDasharray: "800",
              strokeDashoffset: "800",
              animation: "stroke-draw 2.5s ease-in-out infinite",
            }}
          >
            WOX.11
          </text>
          <text
            x="50%"
            y="50%"
            dominantBaseline="central"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="48"
            fontWeight="900"
            letterSpacing="-2"
            fill="url(#wox-gradient)"
            style={{
              strokeDasharray: "800",
              strokeDashoffset: "800",
              animation: "fill-in 2.5s ease-in-out infinite",
            }}
          >
            WOX.11
          </text>
        </svg>
      </div>

      {/* Loading dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-zinc-900"
            style={{
              animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes stroke-draw {
          0% {
            stroke-dashoffset: 800;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -800;
          }
        }
        @keyframes fill-in {
          0%,
          20% {
            opacity: 0;
          }
          40%,
          60% {
            opacity: 1;
          }
          80%,
          100% {
            opacity: 0;
          }
        }
        @keyframes bounce-dot {
          0%,
          80%,
          100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
