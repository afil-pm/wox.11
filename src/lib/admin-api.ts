export function getStoredAdminUser(): { role?: string; token?: string; email?: string } | null {
  try {
    const stored = localStorage.getItem("wox-user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    if (user?.role === "ADMIN") return user;
  } catch {}
  return null;
}

export function getAdminHeaders(): Record<string, string> {
  const user = getStoredAdminUser();
  if (!user) return {};
  const headers: Record<string, string> = {};
  // Signed session token — the only credential the server trusts. A plain
  // `x-admin-email` header is deliberately never sent: it is not a secret.
  if (user.token) headers["x-session-token"] = user.token;
  return headers;
}

export async function adminFetch(url: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...getAdminHeaders(),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });

  if (
    (res.status === 401 || (res.status === 403 && !getAdminHeaders()["x-session-token"])) &&
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/wox/admin")
  ) {
    // Missing/expired session: send the admin back to the login screen instead
    // of silently rendering an empty panel.
    try {
      localStorage.removeItem("wox-user");
    } catch {}
    window.location.assign("/wox/admin/login");
    return res;
  }

  return res;
}
