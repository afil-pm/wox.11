"use client";

import { useState, useEffect } from "react";
import WoxLoader from "@/components/ui/wox-loader";

export default function PwaSplash() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const inline = document.getElementById("wox-inline-splash");
    if (inline) inline.remove();

    const fadeTimer = setTimeout(() => {
      setPhase("fade");
    }, 1600);

    const goneTimer = setTimeout(() => {
      setPhase("gone");
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      id="wox-pwa-splash"
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: "#000000",
        opacity: phase === "show" ? 1 : 0,
        transition: "opacity 0.35s ease-out",
        pointerEvents: "auto",
      }}
    >
      <style>{`
        #wox-pwa-splash svg text { fill: #ffffff !important; stroke: #ffffff !important; }
        #wox-pwa-splash .bg-zinc-900 { background-color: #ffffff !important; }
        #wox-pwa-splash .bg-zinc-100 { background-color: #27272a !important; }
        #wox-pwa-splash .text-zinc-900 { color: #ffffff !important; }
        #wox-pwa-splash .text-zinc-400 { color: #a1a1aa !important; }
        #wox-pwa-splash .border-zinc-200 { border-color: #3f3f46 !important; }
      `}</style>
      <WoxLoader />
    </div>
  );
}
