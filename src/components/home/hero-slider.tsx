"use client";

import {
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
  type KeyboardEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { isExternalImageUrl } from "@/lib/images";
import type { HeroSlideData } from "@/lib/hero-slides";

/** Long enough to read a slide, short enough to feel alive. */
const AUTO_ADVANCE_MS = 4500;
const TRANSITION_MS = 700;
const SWIPE_THRESHOLD_PX = 48;
const AXIS_DEAD_ZONE_PX = 10;

type DragState = {
  startX: number;
  startY: number;
  dx: number;
  axis: "x" | "y" | null;
};

type TrackEntry = {
  key: string;
  slide: HeroSlideData;
  clone: boolean;
  realIndex: number;
};

/**
 * Horizontal sliding carousel for the storefront hero.
 *
 * - `slides` arrive server-rendered (see `app/(store)/page.tsx`), so the first
 *   paint already shows the admin-managed banners — nothing to fetch, nothing
 *   flashes.
 * - The track holds a clone of the last slide at the front and a clone of the
 *   first at the end; after a wrap transition finishes the track silently
 *   unwraps to the real slide, which is how the loop stays seamless.
 * - Auto-advance is driven by the active pill's progress animation ending, so
 *   indicator and rotation can never drift apart. Hover/focus/swipe pause both.
 */
export default function HeroSlider({ slides }: { slides: HeroSlideData[] }) {
  const n = slides.length;
  const loop = n > 1;

  // Track slot: 0 = clone of the last slide, 1..n = real slides, n+1 = clone
  // of the first slide. Single-slide heroes sit at 0 with no clones at all.
  const [pos, setPos] = useState(loop ? 1 : 0);
  const [animate, setAnimate] = useState(false);
  const [dragDx, setDragDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [motionReady, setMotionReady] = useState(false);

  const dragRef = useRef<DragState | null>(null);
  const animatingRef = useRef(false);
  const settleTimeoutRef = useRef<number | null>(null);

  const logical = loop ? (((pos - 1) % n) + n) % n : 0;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setMotionReady(true);
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    setMotionReady(true);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // After sliding onto a cloned edge, jump to the matching real slide with the
  // transition disabled — the visitor never sees the swap.
  useEffect(() => {
    if (!loop || (pos !== 0 && pos !== n + 1)) return;
    const timeout = window.setTimeout(
      () => {
        animatingRef.current = false;
        setAnimate(false);
        setPos(pos === 0 ? n : 1);
      },
      reducedMotion ? 10 : TRANSITION_MS + 60
    );
    return () => window.clearTimeout(timeout);
  }, [pos, n, loop, reducedMotion]);

  useEffect(
    () => () => {
      if (settleTimeoutRef.current) window.clearTimeout(settleTimeoutRef.current);
    },
    []
  );

  function step(dir: 1 | -1) {
    if (!loop || animatingRef.current) return;
    const current = (((pos - 1) % n) + n) % n;
    const target =
      dir === 1
        ? current === n - 1
          ? n + 1
          : current + 2
        : current === 0
          ? 0
          : current;
    animatingRef.current = true;
    setAnimate(!reducedMotion);
    setPos(target);
    if (settleTimeoutRef.current) window.clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = window.setTimeout(
      () => {
        animatingRef.current = false;
      },
      reducedMotion ? 10 : TRANSITION_MS + 80
    );
  }

  function goTo(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= n || nextIndex === logical) return;
    if (nextIndex === (logical + 1) % n) return step(1);
    if (nextIndex === (logical - 1 + n) % n) return step(-1);
    // Distant indicator: jump without animating through the slides between.
    animatingRef.current = false;
    if (settleTimeoutRef.current) window.clearTimeout(settleTimeoutRef.current);
    setAnimate(false);
    setPos(nextIndex + 1);
  }

  function handleProgressEnd(e: AnimationEvent<HTMLSpanElement>) {
    if (e.target !== e.currentTarget) return;
    step(1);
  }

  function handleTouchStart(e: ReactTouchEvent<HTMLElement>) {
    if (!loop || e.touches.length !== 1) {
      dragRef.current = null;
      return;
    }
    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      dx: 0,
      axis: null,
    };
  }

  function handleTouchMove(e: ReactTouchEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - drag.startX;
    const dy = touch.clientY - drag.startY;
    if (!drag.axis) {
      if (Math.abs(dx) < AXIS_DEAD_ZONE_PX && Math.abs(dy) < AXIS_DEAD_ZONE_PX) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical gesture: hand the page scroll back to the browser.
        dragRef.current = null;
        setDragging(false);
        return;
      }
      drag.axis = "x";
      setDragging(true);
      setAnimate(false);
    }
    if (drag.axis !== "x") return;
    drag.dx = dx;
    setDragDx(dx);
  }

  function endDrag() {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) {
      setDragging(false);
      return;
    }
    const swiped = drag.axis === "x";
    const dx = drag.dx;
    setDragging(false);
    if (!swiped) return;
    setDragDx(0);
    if (Math.abs(dx) >= SWIPE_THRESHOLD_PX) {
      step(dx < 0 ? 1 : -1);
    } else {
      // Not far enough — glide back under the finger.
      setAnimate(!reducedMotion);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  }

  if (n === 0) return null;

  const track: TrackEntry[] = loop
    ? [
        {
          key: `${slides[n - 1].id}--wrap-prev`,
          slide: slides[n - 1],
          clone: true,
          realIndex: n - 1,
        },
        ...slides.map((slide, i) => ({ key: slide.id, slide, clone: false, realIndex: i })),
        {
          key: `${slides[0].id}--wrap-next`,
          slide: slides[0],
          clone: true,
          realIndex: 0,
        },
      ]
    : slides.map((slide, i) => ({ key: slide.id, slide, clone: false, realIndex: i }));

  const trackStyle: CSSProperties = {
    transform: `translate3d(calc(${-pos * 100}% + ${dragDx}px), 0, 0)`,
    transition:
      animate && !reducedMotion
        ? `transform ${TRANSITION_MS}ms cubic-bezier(0.65, 0.05, 0.36, 1)`
        : "none",
  };

  const showControls = n > 1;

  return (
    <section
      className="relative min-h-[80vh] touch-pan-y overflow-hidden bg-zinc-950 px-4 py-20 text-center select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={endDrag}
      onTouchCancel={endDrag}
      onKeyDown={handleKeyDown}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="flex h-full" style={trackStyle}>
          {track.map((entry) => {
            const { slide, clone, realIndex } = entry;
            const isActive = !clone && realIndex === logical;
            const Heading = clone ? "div" : "h1";
            return (
              <div
                key={entry.key}
                className={cn(
                  "relative h-full w-full flex-none bg-zinc-900",
                  !isActive && "pointer-events-none"
                )}
                aria-hidden={!isActive}
              >
                <Image
                  src={slide.image}
                  alt={slide.imageAlt || slide.title}
                  fill
                  sizes="100vw"
                  // Local artwork goes through the optimizer (AVIF/WebP, cached
                  // for a month); links and data URLs render straight from
                  // source. Every slide loads eagerly — a half-swiped-into
                  // banner must never show a blank frame.
                  unoptimized={isExternalImageUrl(slide.image) || slide.image.startsWith("data:")}
                  priority={!clone && realIndex === 0}
                  loading="eager"
                  draggable={false}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 mx-auto flex max-w-3xl flex-col items-center justify-center">
                  <Heading className="text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                    {slide.title}
                  </Heading>
                  {slide.subtitle ? (
                    <p className="mt-4 text-lg font-light text-zinc-300 sm:text-xl">{slide.subtitle}</p>
                  ) : null}
                  {(slide.ctaLabel || slide.secondaryCtaLabel) && (
                    <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                      {slide.ctaLabel ? (
                        <Link
                          href={slide.ctaHref || "/"}
                          className="group inline-flex h-13 w-48 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-semibold uppercase tracking-wider text-zinc-900 whitespace-nowrap transition-all hover:scale-105 hover:shadow-lg"
                        >
                          {slide.ctaLabel}
                          <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                        </Link>
                      ) : null}
                      {slide.secondaryCtaLabel ? (
                        <Link
                          href={slide.secondaryCtaHref || "/"}
                          className="group inline-flex h-13 w-48 items-center justify-center gap-2 rounded-full border-2 border-white px-8 text-sm font-semibold uppercase tracking-wider text-white whitespace-nowrap transition-all hover:scale-105 hover:bg-white hover:text-zinc-900 hover:shadow-lg"
                        >
                          {slide.secondaryCtaLabel}
                          <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showControls && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
          </button>

          {/* Indicators: the active slide wears an elongated dark pill whose
              fill is the auto-advance progress; the rest are light-grey dots. */}
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}: ${slide.title}`}
                aria-current={i === logical}
                className={cn(
                  "relative h-2.5 overflow-hidden rounded-full shadow-[0_1px_5px_rgba(0,0,0,0.45)] transition-all duration-300",
                  i === logical
                    ? "w-9 bg-zinc-950"
                    : "w-2.5 bg-zinc-300/90 hover:bg-zinc-200"
                )}
              >
                {i === logical && motionReady && !reducedMotion ? (
                  <span
                    className="hero-slide-progress absolute inset-0 origin-left rounded-full bg-white/70"
                    style={{
                      animationDuration: `${AUTO_ADVANCE_MS}ms`,
                      animationPlayState: paused || dragging ? "paused" : "running",
                    }}
                    onAnimationEnd={handleProgressEnd}
                  />
                ) : null}
              </button>
            ))}
          </div>
        </>
      )}

      <span className="sr-only" aria-live="polite">
        {slides[logical]?.title ?? ""}
      </span>
    </section>
  );
}
