import Link from "next/link";

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
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-none bg-zinc-900 px-8 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800"
      >
        Go Home
      </Link>
    </div>
  );
}
