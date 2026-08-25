export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-zinc-400">
          WOX.11
        </p>
      </div>
    </div>
  );
}
