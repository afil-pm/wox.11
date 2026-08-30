"use client";

import { useEffect } from "react";
import { getOrCreateUserId } from "@/lib/user-id";

export default function UserIdProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getOrCreateUserId();
  }, []);

  return <>{children}</>;
}
