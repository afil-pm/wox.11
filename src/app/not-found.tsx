import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found | WOX.11",
  description: "The page you're looking for doesn't exist or has been moved. Browse our men's and boys fashion collection.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Error 404
      </p>
      <h1 className="mt-4 text-4xl font-bold uppercase tracking-tight text-zinc-900 sm:text-5xl">
        Page Not Found
      </h1>
      <p className="mt-4 max-w-md text-sm text-zinc-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-none bg-zinc-900 px-8 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800"
        >
          Go Home
        </Link>
        <Link
          href="/men"
          className="inline-flex h-12 items-center justify-center rounded-none border border-zinc-900 px-8 text-sm font-semibold uppercase tracking-wider text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          Shop Men
        </Link>
        <Link
          href="/boys"
          className="inline-flex h-12 items-center justify-center rounded-none border border-zinc-900 px-8 text-sm font-semibold uppercase tracking-wider text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          Shop Boys
        </Link>
      </div>
    </div>
  );
}
