"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  ArrowLeft,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import WoxLoader from "@/components/ui/wox-loader";
import SignOutModal from "@/components/ui/sign-out-modal";
import { useSignOutStore } from "@/lib/stores/sign-out";
import { useUnreadCounts } from "@/hooks/use-unread-counts";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", section: "" },
  { label: "Products", icon: Package, href: "/admin/products", section: "" },
  { label: "Orders", icon: ShoppingCart, href: "/admin/orders", section: "orders" },
  { label: "Messages", icon: MessageSquare, href: "/admin/messages", section: "messages" },
];

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function TotalBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[9px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const checked = useRef(false);
  const openSignOut = useSignOutStore((s) => s.open);

  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const { counts, markAsRead } = useUnreadCounts(isAdminPage);

  const isLoginPage = pathname === "/admin/login";

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
        router.replace("/admin/login");
        return;
      }
      const user = JSON.parse(raw);
      if (user.role !== "ADMIN") {
        router.replace("/admin/login");
        return;
      }
      setAuthorized(true);
    } catch {
      router.replace("/admin/login");
    }
  }, [isLoginPage, router]);

  useEffect(() => {
    if (!isAdminPage || authorized !== true) return;

    const matched = navItems.find((item) => {
      if (item.href === "/admin") return pathname === "/admin";
      return pathname.startsWith(item.href);
    });

    if (matched?.section) {
      markAsRead(matched.section);
    }
  }, [pathname, isAdminPage, authorized, markAsRead]);

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <WoxLoader />
      </div>
    );
  }

  // Login page — minimal layout, no sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
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
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.section && <Badge count={counts[item.section as keyof typeof counts] || 0} />}
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
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-4 flex-1 lg:ml-0" />
          <div className="flex items-center gap-3">
            <div className="relative flex items-center gap-2 rounded-lg p-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
                A
              </div>
              <TotalBadge count={counts.total} />
              <span className="hidden text-sm font-medium md:block">
                Admin
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
  );
}
