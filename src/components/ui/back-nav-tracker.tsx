"use client";

import { useEffect } from "react";
import { installHistoryDepth } from "@/lib/back-navigation";

/**
 * Mounts the history-depth tracking once per document so back buttons can
 * decide between walking back and falling back to their parent route.
 * Renders nothing.
 */
export default function BackNavTracker() {
  useEffect(() => {
    installHistoryDepth();
  }, []);

  return null;
}
