import Link from "next/link";
import Image from "next/image";
import { Shirt, ArrowRight } from "lucide-react";
import type { CategoryItem } from "./data";

function PantsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 4h14l-1.5 16H6.5L5 4Z" />
      <path d="M9 4V2h6v2" />
      <path d="M12 4v16" />
    </svg>
  );
}

export default function CategoryCard({ category }: { category: CategoryItem }) {
  const IconComponent = category.icon === "pants" ? PantsIcon : Shirt;

  return (
    <Link
      href={category.href}
      className="group relative flex aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-inset ring-black/10 dark:ring-white/10"
    >
      <Image
        src={category.image}
        alt={category.title}
        fill
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        sizes="(max-width: 768px) 100vw, 25vw"
      />

      {/* Constant scrim so the caption stays readable on light and dark photos */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

      <div className="absolute left-4 top-4 z-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-sm ring-1 ring-black/10 backdrop-blur-sm dark:bg-black/60 dark:text-white dark:ring-white/20">
          <IconComponent className="h-5 w-5" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
        <h3 className="text-lg font-bold uppercase tracking-wide text-white drop-shadow-sm">
          {category.title}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-white/85 transition-colors duration-300 group-hover:text-white">
          Explore
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
