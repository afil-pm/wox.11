export function getAdminHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem("wox-user");
    if (!stored) return {};
    const user = JSON.parse(stored);
    if (user?.role === "ADMIN" && user?.email) {
      return { "x-admin-email": user.email };
    }
  } catch {}
  return {};
}

export async function adminFetch(url: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...getAdminHeaders(),
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
}
