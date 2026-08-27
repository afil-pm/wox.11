"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type OptimizedImageProps = {
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  fallback?: string;
};

const placeholderSvg = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTVlNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYTNhM2EzIiBmb250LXNpemU9IjEyIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==";

export default function OptimizedImage({ src, alt, className, sizes, loading, fallback }: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setLoaded(false);
    setError(false);
  }, [src]);

  if (error) {
    if (fallback) {
      return (
        <div className={cn("overflow-hidden", className)}>
          <img src={fallback} alt={alt || ""} className="h-full w-full object-cover" loading="lazy" />
        </div>
      );
    }
    return (
      <div className={cn("flex items-center justify-center bg-zinc-200 text-zinc-400", className)}>
        <span className="text-xs">No Image</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && (
        <img
          src={placeholderSvg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover blur-sm"
          aria-hidden
        />
      )}
      <Image
        src={imgSrc}
        alt={alt || ""}
        fill
        className={cn(
          "object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        sizes={sizes || "200px"}
        loading={loading ?? "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
