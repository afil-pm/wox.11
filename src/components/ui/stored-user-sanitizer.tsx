"use client";

import { useEffect } from "react";
import { safeStoredUser } from "@/lib/auth/stored-user";

/**
 * Accounts written before the session token moved out of the browser keep a
 * stale credential in `wox-user` until they sign in again. This scrubs it on
 * first paint of any page, so the token does not stay readable to injected
 * script for the rest of its lifetime. The HttpOnly cookie is unaffected —
 * nobody is logged out.
 */
export default function StoredUserSanitizer() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem("wox-user");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const clean = safeStoredUser(parsed);
      if (Object.keys(clean).length !== Object.keys(parsed).length) {
        localStorage.setItem("wox-user", JSON.stringify(clean));
      }
    } catch {
      // Malformed entry: leave it for the next sign-in to overwrite.
    }
  }, []);

  return null;
}
