"use client";

import { useState, useEffect } from "react";
import WoxLoader from "@/components/ui/wox-loader";

export default function PwaSplash() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    // Remove the inline splash that was rendered before React hydrated
    const inline = document.getElementById("wox-inline-splash");
    if (inline) inline.remove();

    // Start fade out after animation cycle
    const fadeTimer = setTimeout(() => {
      setPhase("fade");
    }, 1600);

    // Remove from DOM after transition
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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white"
      style={{
        opacity: phase === "show" ? 1 : 0,
        transition: "opacity 0.35s ease-out",
        pointerEvents: "auto",
      }}
    >
      <WoxLoader />
    </div>
  );
}
