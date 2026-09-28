"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { createImageViewerHistoryController } from "@/lib/image-viewer-history";

type ViewerImage = { url: string; alt?: string | null };

type Props = {
  /** All images of the selected colour: the viewer never mixes colours. */
  images: ViewerImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Shown next to the counter; usually the product/colour title. */
  title?: string;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const STEP = 1.4;
/** Horizontal travel (px) a swipe needs before it changes the image. */
const SWIPE_THRESHOLD = 60;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Full screen product image viewer for one colour's gallery.
 *
 * Zoom: wheel / pinch around the pointer, drag to pan, double click, buttons
 * and +/- keys. Images: prev/next buttons, arrow keys and a horizontal swipe
 * (while not zoomed in).
 *
 * History: opening pushes one history entry, so the phone's system Back button
 * closes the viewer instead of leaving the product page. Closing with X or
 * Escape pops that entry again.
 */
export default function ImageZoom({ images, index, onIndexChange, onClose, title }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swipeAxis = useRef<"x" | "y" | null>(null);
  // Survives StrictMode's double effect run so the history entry is owned once.
  const historyController = useRef<ReturnType<typeof createImageViewerHistoryController> | null>(null);
  if (!historyController.current) historyController.current = createImageViewerHistoryController();

  // Always current values for the native listeners registered once below.
  const indexRef = useRef(index);
  const imagesRef = useRef(images);
  const onIndexChangeRef = useRef(onIndexChange);
  const onCloseRef = useRef(onClose);
  const scaleRef = useRef(1);
  indexRef.current = index;
  imagesRef.current = images;
  onIndexChangeRef.current = onIndexChange;
  onCloseRef.current = onClose;
  scaleRef.current = scale;

  const count = images.length;
  const current = images[index] ?? images[0];
  const alt = current?.alt || title || "Product image";

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback((next: number) => {
    const total = imagesRef.current.length;
    if (total === 0) return;
    const wrapped = ((next % total) + total) % total;
    if (wrapped === indexRef.current) return;
    // Each colour keeps its own index; changing image never resets the zoom.
    setScale(1);
    setOffset({ x: 0, y: 0 });
    onIndexChangeRef.current(wrapped);
  }, []);

  const close = useCallback(() => onCloseRef.current(), []);

  /**
   * One history entry per open viewer: the mobile system Back button pops it,
   * which closes the viewer instead of leaving the product page.
   */
  useEffect(() => {
    const controller = historyController.current;
    if (!controller) return undefined;
    try {
      const handle = controller.open(
        {
          getState: () => window.history.state as Record<string, unknown> | null,
          pushState: (state) => window.history.pushState(state, ""),
          back: () => window.history.back(),
          subscribe: (listener) => {
            window.addEventListener("popstate", listener);
            return () => window.removeEventListener("popstate", listener);
          },
        },
        () => onCloseRef.current()
      );
      return () => handle.release();
    } catch {
      // History can be unavailable (private mode): the viewer still works,
      // the Back button then just navigates as usual.
      return undefined;
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(indexRef.current - 1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(indexRef.current + 1);
        return;
      }
      if (e.key === "+" || e.key === "=") zoomAt(null, 1 / STEP);
      if (e.key === "-") zoomAt(null, STEP);
    };
    window.addEventListener("keydown", onKeyDown);

    const frame = frameRef.current;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt({ x: e.clientX, y: e.clientY }, e.deltaY > 0 ? STEP : 1 / STEP);
    };
    // Non passive so the page behind cannot scroll while zooming or swiping.
    frame?.addEventListener("wheel", onWheel, { passive: false });

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        pinch.current = {
          distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
          scale: scaleRef.current,
        };
        dragging.current = false;
        swipeStart.current = null;
        swipeAxis.current = null;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        dragging.current = true;
        lastPointer.current = { x: t.clientX, y: t.clientY };
        swipeStart.current = { x: t.clientX, y: t.clientY };
        swipeAxis.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinch.current) {
        e.preventDefault();
        const [a, b] = [e.touches[0], e.touches[1]];
        const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const next = clamp(
          pinch.current.scale * (distance / pinch.current.distance),
          MIN_SCALE,
          MAX_SCALE
        );
        const mid = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
        const { cx, cy } = frameCenter();
        const prev = scaleRef.current;
        const k = next / (prev || 1);
        const px = mid.x - cx;
        const py = mid.y - cy;
        setScale(next);
        setOffset((o) => clampOffset({ x: px - k * (px - o.x), y: py - k * (py - o.y) }, next));
        return;
      }

      if (e.touches.length !== 1 || !dragging.current || !swipeStart.current) return;
      const t = e.touches[0];
      const totalX = t.clientX - swipeStart.current.x;
      const totalY = t.clientY - swipeStart.current.y;

      if (!swipeAxis.current && Math.hypot(totalX, totalY) > 8) {
        swipeAxis.current = Math.abs(totalX) > Math.abs(totalY) ? "x" : "y";
      }

      // Zoomed in: a single finger pans the image.
      if (scaleRef.current > 1) {
        e.preventDefault();
        const dx = t.clientX - lastPointer.current.x;
        const dy = t.clientY - lastPointer.current.y;
        lastPointer.current = { x: t.clientX, y: t.clientY };
        setOffset((o) => clampOffset({ x: o.x + dx, y: o.y + dy }, scaleRef.current));
        return;
      }

      // Not zoomed: a horizontal swipe moves between this colour's images.
      if (swipeAxis.current === "x") {
        e.preventDefault();
        lastPointer.current = { x: t.clientX, y: t.clientY };
        setOffset({ x: totalX, y: 0 });
      }
    };

    const onTouchEnd = () => {
      pinch.current = null;
      dragging.current = false;
      const start = swipeStart.current;
      const axis = swipeAxis.current;
      swipeStart.current = null;
      swipeAxis.current = null;

      if (scaleRef.current > 1) return;
      if (axis === "x" && start) {
        const dx = lastPointer.current.x - start.x;
        if (Math.abs(dx) >= SWIPE_THRESHOLD) {
          goTo(indexRef.current + (dx < 0 ? 1 : -1));
          return;
        }
      }
      setOffset({ x: 0, y: 0 });
    };

    frame?.addEventListener("touchstart", onTouchStart, { passive: false });
    frame?.addEventListener("touchmove", onTouchMove, { passive: false });
    frame?.addEventListener("touchend", onTouchEnd);
    frame?.addEventListener("touchcancel", onTouchEnd);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      frame?.removeEventListener("wheel", onWheel);
      frame?.removeEventListener("touchstart", onTouchStart);
      frame?.removeEventListener("touchmove", onTouchMove);
      frame?.removeEventListener("touchend", onTouchEnd);
      frame?.removeEventListener("touchcancel", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [close, goTo]);

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

  function onDoubleClick(e: React.MouseEvent) {
    if (scale > 1) {
      reset();
    } else {
      zoomAt({ x: e.clientX, y: e.clientY }, 2.5);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="min-w-0 truncate text-xs text-white/70">
          {title ? `${title} · ` : ""}
          {count > 0 ? `${index + 1} / ${count}` : ""}
        </span>
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
            onClick={close}
            aria-label="Close image viewer"
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
        onDoubleClick={onDoubleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={current?.url}
          alt={alt}
          draggable={false}
          className="max-h-[80vh] max-w-[92vw] select-none object-contain shadow-2xl"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
            transformOrigin: "center center",
            transition: dragging.current || pinch.current ? "none" : "transform 0.12s ease-out",
          }}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous image"
              className="absolute left-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              style={{ top: "50%" }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next image"
              className="absolute right-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              style={{ top: "50%" }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      <p className="pb-4 text-center text-xs text-white/60">
        {count > 1
          ? "Swipe or use ← → to change image · scroll or pinch to zoom · drag to pan · Esc to close"
          : "Scroll or pinch to zoom · drag to pan · double click to toggle · Esc to close"}
      </p>
    </div>
  );
}
