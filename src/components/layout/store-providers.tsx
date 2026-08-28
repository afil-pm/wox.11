"use client";

import SignOutModal from "@/components/ui/sign-out-modal";

export default function StoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SignOutModal />
    </>
  );
}
