"use client";

import { Shield } from "lucide-react";
import { useSignOutStore } from "@/lib/stores/sign-out";

export default function SignOutModal() {
  const { isOpen, userName, close, logout } = useSignOutStore();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
      onClick={close}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
            <Shield className="h-8 w-8 text-zinc-600" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            See you soon{userName ? `, ${userName.split(" ")[0]}` : ""}
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            You&apos;re about to sign out of your account. Your cart and wishlist will be saved.
          </p>
        </div>
        <div className="flex border-t border-zinc-100">
          <button
            onClick={close}
            className="flex-1 px-4 py-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Stay Signed In
          </button>
          <div className="w-px bg-zinc-100" />
          <button
            onClick={logout}
            className="flex-1 px-4 py-3.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
