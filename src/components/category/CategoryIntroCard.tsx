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
      className="group flex flex-col justify-between rounded-2xl bg-[#0f0f11] p-6 ring-1 ring-inset ring-white/10 transition-all duration-300 hover:bg-[#17171a] dark:bg-[#151518] dark:hover:bg-[#1c1c20] sm:p-8"
    >
      <div>
        <h3 className="text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
          {label}
        </h3>
        <div className="mt-3 h-px w-8 bg-white/30" />
        <p className="mt-4 text-sm leading-relaxed text-white/65 whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/90 transition-colors duration-300 group-hover:text-white">
        SHOP {label}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
