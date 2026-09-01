"use client";

import SignOutModal from "@/components/ui/sign-out-modal";
import ThemeProvider from "@/lib/theme-context";

export default function StoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <SignOutModal />
    </ThemeProvider>
  );
}
