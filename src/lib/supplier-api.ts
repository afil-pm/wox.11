export function getSupplierStoredUser(): {
  role?: string;
  token?: string;
  supplierName?: string;
} | null {
  try {
    const stored = localStorage.getItem("wox-user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    if (user?.role === "SUPPLIER") return user;
  } catch {}
  return null;
}

export function getSupplierHeaders(): Record<string, string> {
  const user = getSupplierStoredUser();
  if (!user) return {};
  const headers: Record<string, string> = {};
  if (user.token) headers["x-session-token"] = user.token;
  return headers;
}

export async function supplierFetch(url: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...getSupplierHeaders(),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });

  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/wox/supplier")
  ) {
    try {
      localStorage.removeItem("wox-user");
    } catch {}
    window.location.assign("/wox/supplier/login");
    return res;
  }

  return res;
}
