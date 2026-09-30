export function getSupplierStoredUser(): {
  role?: string;
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

export async function supplierFetch(url: string, options: RequestInit = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  // Credential = HttpOnly `wox-session` cookie only. No token is read from or
  // written to localStorage, so an injected script cannot lift it.
  const res = await fetch(url, { ...options, headers, credentials: "same-origin" });

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
