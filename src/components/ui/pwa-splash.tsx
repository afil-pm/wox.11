"use client";

import { useState, useEffect } from "react";
import WoxLoader from "@/components/ui/wox-loader";

export default function PwaSplash() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease-out",
        pointerEvents: visible ? "auto" : "none",
      }}
      onAnimationEnd={() => {
        if (!visible) {
          const el = document.getElementById("wox-pwa-splash");
          if (el) el.remove();
        }
      }}
    >
      <WoxLoader />
    </div>
  );
}
