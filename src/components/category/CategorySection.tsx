import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryGroups } from "./data";
import CategoryGroup from "./CategoryGroup";

export default function CategorySection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-zinc-900 sm:text-3xl">
            Shop by Category
          </h2>
          <Link
            href="/men"
            className="hidden items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:flex"
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
        <div className="mt-6 space-y-4 sm:hidden">
          {categoryGroups.map((group) => (
            <div key={group.gender}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-zinc-300">|</span>
                  <span className="text-[11px] text-zinc-400 leading-tight">
                    {group.description.replace("\n", " ")}
                  </span>
                </div>
                <Link
                  href={group.href}
                  className="text-[11px] font-medium text-zinc-400 hover:text-zinc-900"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {group.categories.map((cat) => (
                  <Link
                    key={`${group.gender}-${cat.slug}`}
                    href={cat.href}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 transition-all active:scale-95"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform group-hover:scale-110">
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
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-700">
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
          className="mt-8 flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:hidden"
        >
          View All Categories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
