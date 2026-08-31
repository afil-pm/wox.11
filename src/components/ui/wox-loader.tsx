"use client";

import { cn } from "@/lib/utils";

export default function WoxLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      {/* Animated brand mark */}
      <div className="relative flex items-center justify-center">
        {/* Glow ring */}
        <div className="absolute h-20 w-20 rounded-full border border-zinc-200 opacity-0 wox-glow" />

        {/* Brand text with letter stagger */}
        <div className="flex items-baseline gap-0">
          {["W", "O", "X"].map((letter, i) => (
            <span
              key={`l-${i}`}
              className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl wox-letter"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              {letter}
            </span>
          ))}
          <span
            className="ml-0.5 text-4xl font-black tracking-tight text-zinc-400 sm:text-5xl wox-dot"
          >
            .
          </span>
          {["1", "1"].map((digit, i) => (
            <span
              key={`d-${i}`}
              className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl wox-letter"
              style={{ animationDelay: `${(i + 4) * 0.12}s` }}
            >
              {digit}
            </span>
          ))}
        </div>
      </div>

      {/* Subtle progress line */}
      <div className="h-[2px] w-24 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full bg-zinc-900 wox-progress" />
      </div>

      <style jsx>{`
        @keyframes wox-letter-in {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.9);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        @keyframes wox-dot-in {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          60% {
            opacity: 1;
            transform: scale(1.3);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes wox-glow-pulse {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
          100% {
            opacity: 0;
            transform: scale(1.2);
          }
        }
        @keyframes wox-progress-slide {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .wox-letter {
          animation: wox-letter-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .wox-dot {
          animation: wox-dot-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.48s both;
        }
        .wox-glow {
          animation: wox-glow-pulse 2s ease-in-out infinite;
        }
        .wox-progress {
          animation: wox-progress-slide 1.5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .wox-letter,
          .wox-dot,
          .wox-glow,
          .wox-progress {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>
    </div>
  );
}
