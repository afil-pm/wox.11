"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { goBackOr } from "@/lib/back-navigation";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  /** Parent route used when the tab has no previous page to go back to. */
  href: string;
  /** Optional caption shown next to the icon; icon-only when omitted. */
  label?: string;
  /* * `bare` matches the storefront links, `outline` the admin panel. */
  variant?: "bare" | "outline";
  className?: string;
  title?: string;
};

/**
 * Site-wide back control. Walks the real browser history when this tab has a
 * previous entry (so it never adds a duplicate entry and stays in sync with
 * the browser Back button) and otherwise falls back to the parent route.
 */
export default function BackButton({
  href,
  label,
  variant = "bare",
  className,
  title,
}: BackButtonProps) {
  const router = useRouter();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    // Let modified clicks (new tab, download, …) use the plain href.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();

    goBackOr(() => router.push(href));
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      title={title ?? (label ?? "Back")}
      aria-label={label ?? "Back"}
      className={cn(
        "inline-flex items-center transition-colors",
        variant === "bare"
          ? cn(
              "text-zinc-500 hover:text-zinc-900",
              label && "gap-2 text-sm font-medium"
            )
          : cn(
              "rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
              label ? "gap-2 px-3 py-2 text-sm font-medium" : "p-2"
            ),
        className
      )}
    >
      <ArrowLeft className={label ? "h-4 w-4" : "h-5 w-5"} />
      {label && <span>{label}</span>}
    </a>
  );
}
