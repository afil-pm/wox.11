"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissedAt = localStorage.getItem("wox-pwa-dismissed");
      if (!dismissedAt || Date.now() - Number(dismissedAt) > 86400000) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      localStorage.setItem("wox-pwa-dismissed", "0");
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("wox-pwa-dismissed", String(Date.now()));
  };

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80">
      <div className="bg-zinc-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-zinc-700">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Install WOX.11</p>
          <p className="text-xs text-zinc-400 truncate">Add to home screen for the best experience</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-white text-zinc-900 text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors shrink-0"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-zinc-500 hover:text-white transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
