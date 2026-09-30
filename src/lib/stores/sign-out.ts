import { create } from "zustand";

interface SignOutState {
  isOpen: boolean;
  userName: string;
  open: (userName?: string) => void;
  close: () => void;
  logout: () => void;
}

export const useSignOutStore = create<SignOutState>((set) => ({
  isOpen: false,
  userName: "",
  open: (userName?: string) => {
    let name = userName || "";
    if (!name) {
      try {
        const stored = localStorage.getItem("wox-user");
        if (stored) {
          const user = JSON.parse(stored);
          name = user?.name || "";
        }
      } catch {}
    }
    set({ isOpen: true, userName: name });
  },
  close: () => set({ isOpen: false }),
  logout: () => {
    // Best effort: expire the HttpOnly session cookie server side too, so a
    // stolen/copied token in localStorage is not the only thing being cleared.
    try {
      void fetch("/api/auth/logout", { method: "POST", keepalive: true });
    } catch {}
    localStorage.removeItem("wox-user");
    window.dispatchEvent(new Event("auth-change"));
    set({ isOpen: false, userName: "" });
    window.location.href = "/";
  },
}));
