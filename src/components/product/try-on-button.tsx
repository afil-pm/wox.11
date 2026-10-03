"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Camera, CameraOff, X } from "lucide-react";
import WoxLoader from "@/components/ui/wox-loader";
import { Button } from "@/components/ui/button";

const TryOnSession = dynamic(() => import("./try-on-session"), { ssr: false });

export interface TryOnButtonProduct {
  name: string;
  imageUrl: string;
  categorySlug: string;
  categoryName: string;
  color?: string | null;
}

type CameraPhase = "requesting" | "ready" | "denied" | "blocked" | "failed" | "unsupported";

/**
 * "Try On Wear" entry point for product pages. The ONLY place in the
 * storefront that touches the camera: getUserMedia is called exclusively
 * from explicit button clicks (open + Try Again). Opening any page —
 * home, listing, or product details — never requests permission.
 */
export function TryOnButton({ product }: { product: TryOnButtonProduct }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<CameraPhase>("requesting");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [attempt, setAttempt] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });
    streamRef.current = null;
    setStream(null);
  }, []);

  const close = useCallback(() => {
    stopStream();
    setOpen(false);
  }, [stopStream]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Runs ONLY from explicit clicks. Never from effects, timers, or page load.
  const requestCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("unsupported");
      return;
    }
    setPhase("requesting");
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      stopStream();
      streamRef.current = next;
      setStream(next);
      setAttempt((n) => n + 1);
      setPhase("ready");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        // permissions.query() only READS status — it never prompts.
        let blocked = false;
        try {
          const status = await navigator.permissions?.query({
            name: "camera" as PermissionName,
          });
          blocked = status?.state === "denied";
        } catch {}
        setPhase(blocked ? "blocked" : "denied");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setPhase("failed");
      } else {
        setPhase("failed");
      }
    }
  }, [stopStream]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    void requestCamera();
  }, [requestCamera]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-900 py-2.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-900 hover:text-white"
        aria-label={`Try On Wear - virtual try-on for ${product.name}`}
      >
        <Camera className="h-4 w-4" />
        Try On Wear
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Anywear
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Virtual try-on"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-zinc-900">Try On Wear</h2>
                <p className="truncate text-xs text-zinc-500">{product.name}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close try-on"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {phase === "requesting" && (
                <div className="flex flex-col items-center gap-4 py-10">
                  <WoxLoader />
                  <p className="text-sm text-zinc-500">Requesting camera access…</p>
                  <p className="max-w-xs text-center text-xs text-zinc-400">
                    Your browser will ask for permission because you chose virtual try-on.
                  </p>
                </div>
              )}

              {phase === "ready" && stream && (
                <TryOnSession
                  key={attempt}
                  stream={stream}
                  product={product}
                  onRetry={() => void requestCamera()}
                  onClose={close}
                />
              )}

              {(phase === "denied" || phase === "blocked") && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                    <CameraOff className="h-6 w-6 text-zinc-500" />
                  </span>
                  <p className="text-sm font-medium text-zinc-900">
                    Camera access is required for virtual try-on.
                  </p>
                  <p className="max-w-xs text-xs text-zinc-500">
                    {phase === "blocked"
                      ? "Camera is blocked for this site. Allow it in your browser's site settings (the lock icon in the address bar), then try again."
                      : "You declined camera access, so the try-on cannot start. Nothing was recorded — try again whenever you are ready."}
                  </p>
                  <div className="mt-1 flex w-full gap-2">
                    <Button variant="outline" onClick={close} className="flex-1">
                      Close
                    </Button>
                    <Button onClick={() => void requestCamera()} className="flex-1">
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {(phase === "failed" || phase === "unsupported") && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                    <Camera className="h-6 w-6 text-zinc-500" />
                  </span>
                  <p className="text-sm font-medium text-zinc-900">
                    {phase === "unsupported"
                      ? "This browser or device does not support camera access."
                      : "Could not access the camera."}
                  </p>
                  <p className="max-w-xs text-xs text-zinc-500">
                    {phase === "unsupported"
                      ? "Virtual try-on needs a camera-enabled browser."
                      : "Make sure no other app is using the camera, then try again."}
                  </p>
                  <div className="mt-1 flex w-full gap-2">
                    <Button variant="outline" onClick={close} className="flex-1">
                      Close
                    </Button>
                    {phase === "failed" && (
                      <Button onClick={() => void requestCamera()} className="flex-1">
                        Try Again
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-100 px-6 py-3">
              <p className="text-center text-[11px] text-zinc-400">
                Camera is only used while try-on is open · Powered by Anywear
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
