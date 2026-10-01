"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { isExternalImageUrl } from "@/lib/images";
import { DEFAULT_HERO_SLIDES, type HeroSlideData } from "@/lib/hero-slides";

/** Long enough to read a slide, short enough to feel alive. */
const AUTO_ADVANCE_MS = 6000;

export default function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlideData[]>(DEFAULT_HERO_SLIDES);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hero-slides")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data.slides) && data.slides.length > 0 ? data.slides : DEFAULT_HERO_SLIDES;
        setSlides(list);
        setIndex(0);
      })
      .catch(() => {
        // Keep the built-in hero.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const previous = useCallback(() => goTo(index - 1), [goTo, index]);

  // Auto-advance, but never while the visitor is interacting with the banner
  // or has asked the system to cut down on motion.
  useEffect(() => {
    if (slides.length < 2 || paused || reducedMotion) return;
    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, slides.length, paused, reducedMotion]);

  // Warm the next image so the swap never shows a blank frame.
  useEffect(() => {
    if (slides.length < 2) return;
    const upcoming = slides[(index + 1) % slides.length];
    if (!upcoming?.image) return;
    const img = new window.Image();
    img.src = upcoming.image;
  }, [index, slides]);

  const active = slides[index] || DEFAULT_HERO_SLIDES[0];
  const showControls = slides.length > 1;

  return (
    <section
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-20 text-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      {slides.map((slide, i) => {
        const isActive = i === index;
        return (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              isActive ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            aria-hidden={!isActive}
          >
            <Image
              src={slide.image}
              alt={slide.imageAlt || slide.title}
              fill
              sizes="100vw"
              // Local artwork goes through the optimizer (AVIF/WebP, cached for
              // a month); links and data URLs render straight from source.
              unoptimized={isExternalImageUrl(slide.image) || slide.image.startsWith("data:")}
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative mx-auto flex h-full max-w-3xl flex-col items-center justify-center">
              <h1 className="text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                {slide.title}
              </h1>
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

      {showControls && (
        <>
          <button
            type="button"
            onClick={previous}
            className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
          </button>

          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}: ${slide.title}`}
                aria-current={i === index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </>
      )}

      <span className="sr-only" aria-live="polite">
        {active.title}
      </span>
    </section>
  );
}
