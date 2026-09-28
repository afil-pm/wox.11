import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryGroups } from "./data";
import CategoryGroup from "./CategoryGroup";

export default function CategorySection() {
  return (
    <section className="bg-[#ffffff] py-16 dark:bg-[#0a0a0a] sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wider text-black dark:text-white sm:text-3xl">
              Shop by Category
            </h2>
            <div className="mt-3 h-px w-10 bg-[#000000] dark:bg-[#ffffff]" />
          </div>
          <Link
            href="/men"
            className="hidden items-center gap-1.5 text-sm font-medium text-black/55 transition-colors hover:text-black dark:text-white/65 dark:hover:text-white sm:flex"
          >
            View All Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Desktop: original grid layout */}
        <div className="mt-10 hidden space-y-5 sm:block">
          {categoryGroups.map((group) => (
            <CategoryGroup key={group.gender} group={group} />
          ))}
        </div>

        {/* Mobile: compact button grid */}
        <div className="mt-7 space-y-5 sm:hidden">
          {categoryGroups.map((group) => (
            <div key={group.gender}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-black dark:text-white">
                    {group.label}
                  </span>
                  <span className="h-3 w-px shrink-0 bg-black/25 dark:bg-white/30" />
                  <span className="truncate text-[11px] leading-tight text-black/50 dark:text-white/60">
                    {group.description.replace("\n", " ")}
                  </span>
                </div>
                <Link
                  href={group.href}
                  className="shrink-0 text-[11px] font-semibold text-black/60 transition-colors hover:text-black dark:text-white/70 dark:hover:text-white"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {group.categories.map((cat) => (
                  <Link
                    key={`${group.gender}-${cat.slug}`}
                    href={cat.href}
                    className="group flex flex-col items-center gap-2.5 rounded-2xl border border-black/10 bg-white p-3.5 transition-all hover:border-black/35 active:scale-95 dark:border-white/10 dark:hover:border-white/35"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a0a0a] text-[#ffffff] transition-transform group-hover:scale-110 dark:bg-[#fafafa] dark:text-[#0a0a0a]">
                      {cat.icon === "shirt" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M5 4l-1 3h16l-1-3" />
                          <path d="M5 4c0 0-2 1-2 4v2c0 1 .5 2 1.5 2L5 20h14l.5-7c1 0 1.5-1 1.5-2V8c0-3-2-4-2-4" />
                          <path d="M12 4v16" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                          <path d="M5 4h14l-1.5 16H6.5L5 4Z" />
                          <path d="M9 4V2h6v2" />
                          <path d="M12 4v16" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-black dark:text-white">
                      {cat.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/men"
          className="mt-8 flex items-center justify-center gap-1.5 text-sm font-medium text-black/55 transition-colors hover:text-black dark:text-white/65 sm:hidden"
        >
          View All Categories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
