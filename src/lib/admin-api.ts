export function getStoredAdminUser(): { role?: string; email?: string } | null {
  try {
    const stored = localStorage.getItem("wox-user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    if (user?.role === "ADMIN") return user;
  } catch {}
  return null;
}

/** "unknown" means the probe itself failed — treat that as "leave the panel alone". */
async function sessionRole(): Promise<"admin" | "signed-out" | "unknown"> {
  try {
    const res = await fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return "signed-out";
    const data = await res.json();
    return data?.role === "ADMIN" ? "admin" : "signed-out";
  } catch {
    return "unknown";
  }
}

export async function adminFetch(url: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  // The credential is the HttpOnly `wox-session` cookie; nothing from
  // localStorage is copied into a header any more (an injected script could
  // read that copy, so it is not kept there at all).
  const res = await fetch(url, { ...options, headers, credentials: "same-origin" });

  if (
    (res.status === 401 || res.status === 403) &&
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/wox/admin")
  ) {
    // Only bounce to the login screen when the cookie really is missing or
    // expired — a signed-in admin hitting a genuine permission error must
    // see the error, not be logged out.
    const role = await sessionRole();
    if (role === "signed-out") {
      try {
        localStorage.removeItem("wox-user");
      } catch {}
      window.location.assign("/wox/admin/login");
      return res;
    }
  }

  return res;
}
