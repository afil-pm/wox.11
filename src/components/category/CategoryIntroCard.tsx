import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  label: string;
  description: string;
  href: string;
};

export default function CategoryIntroCard({ label, description, href }: Props) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl bg-zinc-900 dark:bg-[#18181b] p-6 transition-all duration-300 hover:bg-zinc-800 dark:hover:bg-[#27272a] sm:p-8"
    >
      <div>
        <h3 className="text-2xl font-bold uppercase tracking-wide text-white dark:text-[#fafafa] sm:text-3xl">
          {label}
        </h3>
        <div className="mt-3 h-px w-8 bg-zinc-600 dark:bg-[#52525b]" />
        <p className="mt-4 text-sm leading-relaxed text-zinc-400 dark:text-[#a1a1aa] whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white dark:text-[#fafafa] transition-colors duration-300">
        SHOP {label}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
