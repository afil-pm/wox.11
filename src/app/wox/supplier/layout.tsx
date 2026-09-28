"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Clock,
  Ban,
  BarChart3,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import WoxLoader from "@/components/ui/wox-loader";
import SignOutModal from "@/components/ui/sign-out-modal";
import ThemeProvider from "@/lib/theme-context";
import { useSignOutStore } from "@/lib/stores/sign-out";
import { supplierFetch } from "@/lib/supplier-api";
import { subscribeToPush } from "@/lib/push-client";
import SupplierNotificationBell from "@/components/supplier/notification-bell";
import { useSupplierNotifications } from "@/lib/stores/supplier-notifications";

// Supplier only: no admin sections are ever reachable from this navigation.
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/wox/supplier" },
  { label: "Analytics", icon: BarChart3, href: "/wox/supplier/analytics" },
  { label: "Products", icon: Package, href: "/wox/supplier/products" },
  { label: "Orders", icon: ShoppingCart, href: "/wox/supplier/orders" },
  { label: "Notifications", icon: Bell, href: "/wox/supplier/notifications" },
];

interface SupplierProfile {
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  verificationStatus?: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  supplierName: string;
}

/**
 * Mirrors the server side fallback in `effectiveVerificationStatus`: accounts
 * stored before the field existed treat an ACTIVE supplierStatus as verified.
 */
function verificationOf(profile: SupplierProfile) {
  if (profile.verificationStatus) return profile.verificationStatus;
  return profile.status === "ACTIVE" ? "VERIFIED" : "PENDING_VERIFICATION";
}

const VERIFICATION_POLL_MS = 8000;

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const checked = useRef(false);
  const openSignOut = useSignOutStore((s) => s.open);
  const unreadNotifications = useSupplierNotifications((s) => s.unreadCount);

  const isLoginPage = pathname === "/wox/supplier/login";

  useEffect(() => {
    if (isLoginPage) {
      setAuthorized(true);
      return;
    }

    if (checked.current) return;
    checked.current = true;

    try {
      const raw = localStorage.getItem("wox-user");
      if (!raw) {
        router.replace("/wox/supplier/login");
        return;
      }
      const user = JSON.parse(raw);
      if (user.role !== "SUPPLIER" || !user.token) {
        router.replace("/wox/supplier/login");
        return;
      }
      setAuthorized(true);
    } catch {
      router.replace("/wox/supplier/login");
    }
  }, [isLoginPage, router]);

  // Keep a push subscription alive for this supplier. The verification
  // completion push has to arrive even while the supplier is sitting on the
  // pending screen (or has the browser closed), which is exactly when this
  // layout runs — unlike the store header, which only mounts elsewhere.
  useEffect(() => {
    if (isLoginPage || authorized !== true) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "denied") return;

    let userId: string | null = null;
    try {
      const raw = localStorage.getItem("wox-user");
      const user = raw ? JSON.parse(raw) : null;
      if (user?.id) userId = user.id;
    } catch {}
    if (!userId) return;

    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (!sub) subscribeToPush(userId).catch(() => {});
        });
      });
    } else if (Notification.permission === "default") {
      subscribeToPush(userId).catch(() => {});
    }
  }, [isLoginPage, authorized]);

  // One shared feed for the header bell, the sidebar badge and the
  // notifications page: polled here so every supplier view stays in sync, and
  // refreshed immediately when the tab comes back to the front.
  useEffect(() => {
    if (isLoginPage || authorized !== true) return;
    const refresh = useSupplierNotifications.getState().refresh;
    refresh();
    const interval = setInterval(refresh, 20000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isLoginPage, authorized]);

  // Server side check of the signed-in supplier. The verification state lives
  // in the database, so it cannot be skipped by closing the browser, going
  // back, opening a new tab/device or editing localStorage. While the account
  // is not verified we keep polling so the panel unlocks automatically as
  // soon as an admin verifies it.
  useEffect(() => {
    if (isLoginPage || authorized !== true) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      try {
        const res = await supplierFetch("/api/wox/supplier/me");
        const data = await res.json();
        if (cancelled) return;
        if (!data?.supplier) {
          timer = setTimeout(load, VERIFICATION_POLL_MS);
          return;
        }
        const next: SupplierProfile = {
          status: data.supplier.status,
          verificationStatus: data.supplier.verificationStatus,
          supplierName: data.supplier.supplierName,
        };
        setProfile(next);
        if (verificationOf(next) !== "VERIFIED") {
          timer = setTimeout(load, VERIFICATION_POLL_MS);
        }
      } catch {
        if (!cancelled) timer = setTimeout(load, VERIFICATION_POLL_MS);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isLoginPage, authorized]);

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <WoxLoader />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Never render panel content before the server confirmed the state.
  if (profile === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <WoxLoader />
      </div>
    );
  }

  const verification = verificationOf(profile);

  if (verification !== "VERIFIED") {
    const pending = verification === "PENDING_VERIFICATION";
    return (
      <ThemeProvider>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
              {pending ? <Clock className="h-7 w-7 text-white" /> : <Ban className="h-7 w-7 text-white" />}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              {pending ? "Account under verification" : "Verification rejected"}
            </h1>
            <p className="mt-3 text-sm text-zinc-500">
              {pending
                ? "Your supplier account is currently under verification. You will be able to access supplier features after verification is completed."
                : "Your supplier account verification was rejected. Please contact the store admin for more information."}
            </p>
            <p className="mt-4 text-xs uppercase tracking-wider text-zinc-400">
              {pending ? "Status refreshes automatically" : "Contact the store admin"}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => openSignOut()}
                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Sign Out
              </button>
              <Link
                href="/"
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
              >
                Back to Store
              </Link>
            </div>
          </div>
        </div>
        <SignOutModal />
      </ThemeProvider>
    );
  }

  if (profile.status === "SUSPENDED") {
    return (
      <ThemeProvider>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
              <Ban className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Account suspended</h1>
            <p className="mt-3 text-sm text-zinc-500">
              Your supplier account has been suspended. Please contact the store admin.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => openSignOut()}
                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Sign Out
              </button>
              <Link
                href="/"
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
              >
                Back to Store
              </Link>
            </div>
          </div>
        </div>
        <SignOutModal />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-50">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-zinc-900 text-white transition-transform duration-200 lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between px-6">
            <Link href="/" className="text-lg font-bold tracking-tight">
              WOX.11
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="border-b border-zinc-800 px-6 pb-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Supplier Panel</p>
            <p className="truncate text-sm font-medium text-white">
              {profile?.supplierName || "Supplier"}
            </p>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                item.href === "/wox/supplier"
                  ? pathname === "/wox/supplier"
                  : pathname.startsWith(item.href);
              const showNotificationBadge = item.href === "/wox/supplier/notifications";
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                  {showNotificationBadge && unreadNotifications > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-zinc-800 p-3">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Store
            </Link>
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="ml-4 flex-1 lg:ml-0" />
            <div className="flex items-center gap-2">
              <SupplierNotificationBell />
              <div className="flex items-center gap-2 rounded-lg p-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
                  {(profile?.supplierName || "S").charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium md:block">
                  {profile?.supplierName || "Supplier"}
                </span>
              </div>
              <button
                onClick={() => openSignOut()}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:block">Logout</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
        <SignOutModal />
      </div>
    </ThemeProvider>
  );
}
