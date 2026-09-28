"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const STEP = 1.4;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Full screen product image viewer: wheel / pinch zoom around the pointer,
 * drag to pan, double click and buttons to zoom, reset button and Escape to
 * close. Works with mouse, trackpad and touch.
 */
export default function ImageZoom({ src, alt, onClose }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const pinch = useRef<{ distance: number; scale: number } | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") zoomAt(null, 1 / STEP);
      if (e.key === "-") zoomAt(null, STEP);
    };
    window.addEventListener("keydown", onKeyDown);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt({ x: e.clientX, y: e.clientY }, e.deltaY > 0 ? STEP : 1 / STEP);
    };
    const frame = frameRef.current;
    // Non passive so the page behind cannot scroll while zooming.
    frame?.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      frame?.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  function frameCenter() {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return { cx: 0, cy: 0 };
    return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
  }

  /** Zooms by `factor`, keeping the point under `clientPoint` stable. */
  function zoomAt(clientPoint: { x: number; y: number } | null, factor: number) {
    setScale((prev) => {
      const next = clamp(prev * factor, MIN_SCALE, MAX_SCALE);
      if (next === prev) return prev;
      const k = next / prev;
      if (clientPoint) {
        const { cx, cy } = frameCenter();
        const px = clientPoint.x - cx;
        const py = clientPoint.y - cy;
        setOffset((o) => ({
          x: px - k * (px - o.x),
          y: py - k * (py - o.y),
        }));
      } else if (next === MIN_SCALE) {
        setOffset({ x: 0, y: 0 });
      }
      return next;
    });
  }

  function clampOffset(next: { x: number; y: number }, nextScale: number) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return next;
    const maxX = ((nextScale - 1) * Math.min(rect.width, 900)) / 2;
    const maxY = ((nextScale - 1) * Math.min(rect.height, 900)) / 2;
    return {
      x: clamp(next.x, -maxX, maxX),
      y: clamp(next.y, -maxY, maxY),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => clampOffset({ x: o.x + dx, y: o.y + dy }, scale));
  }

  function endDrag() {
    dragging.current = false;
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinch.current = {
        distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        scale,
      };
      dragging.current = false;
    } else if (e.touches.length === 1) {
      dragging.current = true;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinch.current) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const next = clamp(pinch.current.scale * (distance / pinch.current.distance), MIN_SCALE, MAX_SCALE);
      const mid = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
      const { cx, cy } = frameCenter();
      const prev = scale;
      const k = next / (prev || 1);
      const px = mid.x - cx;
      const py = mid.y - cy;
      setScale(next);
      setOffset((o) => clampOffset({ x: px - k * (px - o.x), y: py - k * (py - o.y) }, next));
      return;
    }
    if (e.touches.length === 1 && dragging.current) {
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - lastPointer.current.x;
      const dy = t.clientY - lastPointer.current.y;
      lastPointer.current = { x: t.clientX, y: t.clientY };
      setOffset((o) => clampOffset({ x: o.x + dx, y: o.y + dy }, scale));
    }
  }

  function onTouchEnd() {
    pinch.current = null;
    dragging.current = false;
  }

  function onDoubleClick(e: React.MouseEvent) {
    if (scale > 1) {
      reset();
    } else {
      zoomAt({ x: e.clientX, y: e.clientY }, 2.5);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Image zoom">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-white/70">{alt}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => zoomAt(null, 1 / STEP)}
            aria-label="Zoom out"
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomAt(null, STEP)}
            aria-label="Zoom in"
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reset zoom"
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close zoom"
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={frameRef}
        className="relative flex flex-1 cursor-grab items-center justify-center overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onDoubleClick={onDoubleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-[80vh] max-w-[92vw] select-none object-contain shadow-2xl"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
            transformOrigin: "center center",
            transition: dragging.current || pinch.current ? "none" : "transform 0.12s ease-out",
          }}
        />
      </div>

      <p className="pb-4 text-center text-xs text-white/60">
        Scroll or pinch to zoom · drag to pan · double click to toggle · Esc to close
      </p>
    </div>
  );
}
