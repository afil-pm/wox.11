"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Shirt } from "lucide-react";
import { createDecartClient, models, type RealTimeClient } from "@decartai/sdk";
import { buildGarmentPrompt } from "@/lib/try-on/prompts";
import WoxLoader from "@/components/ui/wox-loader";
import { Button } from "@/components/ui/button";

export interface TryOnSessionProduct {
  name: string;
  imageUrl: string;
  categorySlug: string;
  categoryName: string;
  color?: string | null;
}

type SessionMode = "connecting" | "live" | "preview" | "ended" | "error";

/**
 * Garment bytes for the live model. Remote hosts sit outside the CSP
 * connect-src allowlist, so a cross-origin fetch falls back to the
 * same-origin Next.js image optimizer proxy.
 */
async function fetchGarmentBlob(imageUrl: string): Promise<Blob> {
  try {
    const direct = await fetch(imageUrl);
    if (direct.ok) return await direct.blob();
  } catch {}
  const proxied = await fetch(`/_next/image?url=${encodeURIComponent(imageUrl)}&w=1080&q=75`);
  if (!proxied.ok) throw new Error("garment fetch failed");
  return await proxied.blob();
}

/**
 * Runs inside the try-on modal AFTER camera permission was granted.
 * Tries a live Anywear session; when the store has no Decart key yet
 * (token route answers 503) it falls back to a local camera preview so
 * the permission flow stays fully verifiable without any backend secret.
 */
export default function TryOnSession({
  stream,
  product,
  onRetry,
  onClose,
}: {
  stream: MediaStream;
  product: TryOnSessionProduct;
  onRetry: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<SessionMode>("connecting");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // The video elements only mount once their mode renders, and the remote
  // stream can arrive before or after that mount in any order — so bind on
  // every render (guarded: re-assigning the identical stream is skipped).
  useEffect(() => {
    const el = localVideoRef.current;
    if (el && el.srcObject !== stream) {
      el.srcObject = stream;
    }
  });
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (el && remoteStream && el.srcObject !== remoteStream) {
      el.srcObject = remoteStream;
    }
  });

  useEffect(() => {
    let cancelled = false;
    let rt: RealTimeClient | null = null;

    (async () => {
      let tokenRes: Response;
      try {
        tokenRes = await fetch("/api/tryon/token", { method: "POST" });
      } catch {
        if (!cancelled) setMode("error");
        return;
      }
      if (cancelled) return;
      if (tokenRes.status === 503) {
        setMode("preview");
        return;
      }
      if (!tokenRes.ok) {
        setMode("error");
        return;
      }
      const { apiKey } = (await tokenRes.json()) as { apiKey?: string };
      if (!apiKey) {
        setMode("error");
        return;
      }

      let garment: Blob;
      try {
        garment = await fetchGarmentBlob(product.imageUrl);
      } catch {
        if (!cancelled) setMode("error");
        return;
      }
      if (cancelled) return;

      try {
        // Telemetry stays off: the shopper's session must not phone usage
        // data home beyond what the try-on connection itself requires.
        const client = createDecartClient({ apiKey, telemetry: false });
        rt = await client.realtime.connect(stream, {
          model: models.realtime("lucy-vton-latest"),
          onRemoteStream: (remote) => {
            if (!cancelled) setRemoteStream(remote);
          },
          mirror: "auto",
        });
        rt.on("sessionEnded", () => {
          if (!cancelled) setMode("ended");
        });
        const { prompt } = buildGarmentPrompt({
          categorySlug: product.categorySlug,
          categoryName: product.categoryName,
          color: product.color,
        });
        await rt.set({ prompt, image: garment, enhance: false });
        if (!cancelled) setMode("live");
      } catch {
        try {
          rt?.disconnect();
        } catch {}
        rt = null;
        if (!cancelled) setMode("error");
      }
    })();

    return () => {
      cancelled = true;
      try {
        rt?.disconnect();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  if (mode === "connecting") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <WoxLoader />
        <p className="text-sm text-zinc-500">Connecting to live try-on…</p>
      </div>
    );
  }

  if (mode === "preview") {
    return (
      <div className="flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-xl bg-zinc-950">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            data-testid="tryon-local-video"
            className="aspect-[3/4] w-full -scale-x-100 object-cover"
          />
          <span className="absolute left-3 top-3 rounded-full bg-zinc-900/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
            Preview
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3">
          <img src={product.imageUrl} alt={product.name} className="h-14 w-14 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900">{product.name}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Camera preview works. Live try-on connects once the store adds its Decart key.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    );
  }

  if (mode === "live") {
    return (
      <div className="flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-xl bg-zinc-950">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            data-testid="tryon-remote-video"
            className="aspect-[3/4] w-full object-cover"
          />
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
          </span>
        </div>
        <p className="flex items-center gap-2 text-xs text-zinc-500">
          <Shirt className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Trying on <span className="font-medium text-zinc-700">{product.name}</span> · move to see the fit
          </span>
        </p>
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
        <Camera className="h-6 w-6 text-zinc-500" />
      </span>
      <p className="text-sm font-medium text-zinc-900">
        {mode === "ended" ? "The try-on session has ended." : "Could not start the try-on session."}
      </p>
      <p className="max-w-xs text-xs text-zinc-500">
        {mode === "ended"
          ? "Start again whenever you are ready."
          : "Check your connection and try again."}
      </p>
      <div className="mt-1 flex w-full gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Close
        </Button>
        <Button onClick={onRetry} className="flex-1">
          Try Again
        </Button>
      </div>
    </div>
  );
}
