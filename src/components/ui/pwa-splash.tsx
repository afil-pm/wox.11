"use client";

import { useState, useEffect } from "react";
import WoxLoader from "@/components/ui/wox-loader";

export default function PwaSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Remove the inline splash that was rendered before React hydrated
    const inline = document.getElementById("wox-inline-splash");
    if (inline) inline.remove();

    const timer = setTimeout(() => {
      setVisible(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      id="wox-pwa-splash"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white"
      style={{ opacity: 1, transition: "opacity 0.4s ease-out" }}
    >
      <WoxLoader />
    </div>
  );
}
