"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
        <span className="text-2xl">!</span>
      </div>
      <h1 className="mt-6 text-2xl font-bold uppercase tracking-tight text-zinc-900">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-zinc-500">
        An unexpected error occurred. Please try again or contact our support
        team if the problem persists.
      </p>
      <Button onClick={reset} className="mt-8">
        Try Again
      </Button>
    </div>
  );
}
