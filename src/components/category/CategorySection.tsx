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

        <div className="mt-10 space-y-5">
          {categoryGroups.map((group) => (
            <CategoryGroup key={group.gender} group={group} />
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
