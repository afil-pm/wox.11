const USER_ID_KEY = "wox-user-id";
const USER_ID_COOKIE = "wox-uid";

function generateUserId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "";

  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing && existing.length === 32) return existing;

  const cookieMatch = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${USER_ID_COOKIE}=`));
  if (cookieMatch) {
    const cookieVal = cookieMatch.split("=")[1];
    if (cookieVal && cookieVal.length === 32) {
      localStorage.setItem(USER_ID_KEY, cookieVal);
      return cookieVal;
    }
  }

  const newId = generateUserId();
  localStorage.setItem(USER_ID_KEY, newId);
  document.cookie = `${USER_ID_COOKIE}=${newId}; path=/; max-age=31536000; SameSite=Lax; Secure`;
  return newId;
}

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(USER_ID_KEY) || "";
}

export function sendUserIdHeader(): Record<string, string> {
  const id = getUserId();
  return id ? { "x-user-id": id } : {};
}
