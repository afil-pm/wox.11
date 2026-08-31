"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Search, User, Heart, ShoppingBag, Menu, X, LogOut, Package, Settings, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchModal from "@/components/search/search-modal";
import NotificationBell from "@/components/notifications/notification-bell";
import { useSignOutStore } from "@/lib/stores/sign-out";
import { useUnreadCounts } from "@/hooks/use-unread-counts";

const CartCount = dynamic(
  () =>
    import("@/lib/stores/cart").then((mod) => {
      const { default: useCartStore } = mod;
      return function CartCountInner() {
        const totalItems = useCartStore((s) => s.totalItems);
        if (totalItems === 0) return null;
        return (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-medium text-white">
            {totalItems}
          </span>
        );
      };
    }),
  { ssr: false }
);

const WishlistCount = dynamic(
  () =>
    import("@/lib/stores/wishlist").then((mod) => {
      const { useWishlistStore } = mod;
      return function WishlistCountInner() {
        const count = useWishlistStore((s) => s.items.length);
        if (count === 0) return null;
        return (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-medium text-white">
            {count}
          </span>
        );
      };
    }),
  { ssr: false }
);

const navLinks = [
  { label: "Men", href: "/men" },
  { label: "Boys", href: "/boys" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Best Sellers", href: "/best-sellers" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const openSignOut = useSignOutStore((s) => s.open);
  const isAdmin = user?.role === "ADMIN";
  const { counts } = useUnreadCounts(isAdmin);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const stored = localStorage.getItem("wox-user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-change", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const handleLogoutClick = () => {
    setUserMenuOpen(false);
    openSignOut(user?.name || "");
  };

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 0);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-zinc-200 bg-white transition-shadow duration-200",
          scrolled && "shadow-sm"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {/* Mobile: Hamburger */}
          <button
            type="button"
            className="relative -ml-0.5 mr-2 flex h-10 w-10 items-center justify-center text-zinc-900 transition-transform duration-150 active:scale-90 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {/* Desktop: Left logo */}
          <Link
            href="/"
            className="hidden text-lg font-bold tracking-wider text-zinc-900 sm:text-xl lg:block lg:text-2xl"
          >
            WOX.11
          </Link>

          {/* Mobile: Center logo */}
          <Link
            href="/"
            className="mx-auto text-lg font-bold tracking-wider text-zinc-900 lg:hidden"
          >
            WOX.11
          </Link>

          {/* Desktop: Center nav */}
          <nav className="mx-auto hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative py-1 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:text-zinc-900"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-zinc-900 transition-all duration-300 ease-out group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Desktop: Right icons */}
          <div className="hidden items-center gap-1 lg:flex lg:gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center text-zinc-900 transition-all duration-150 hover:text-zinc-600 active:scale-90"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <NotificationBell />

            <Link
              href="/account/orders"
              className="flex h-10 w-10 items-center justify-center text-zinc-900 transition-all duration-150 hover:text-zinc-600 active:scale-90"
              aria-label="Orders"
            >
              <Package className="h-5 w-5" strokeWidth={1.5} />
            </Link>

            <Link
              href="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center text-zinc-900 transition-all duration-150 hover:text-zinc-600 active:scale-90"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" strokeWidth={1.5} />
              <WishlistCount />
            </Link>

            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center text-zinc-900 transition-all duration-150 hover:text-zinc-600 active:scale-90"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              <CartCount />
            </Link>

            {/* User Menu - Dropdown */}
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    userMenuOpen ? "bg-zinc-200 text-zinc-900" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  )}
                >
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                    {counts.total > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[9px] font-bold text-white">
                        {counts.total > 99 ? "99+" : counts.total}
                      </span>
                    )}
                  </span>
                  <span className="hidden xl:inline">{user.name}</span>
                  <ChevronRight className={cn("h-3 w-3 transition-transform", userMenuOpen && "rotate-90")} />
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  <User className="h-4 w-4" strokeWidth={1.5} />
                  <span className="hidden xl:inline">Sign In</span>
                </Link>
              )}

              {/* Dropdown */}
              {user && userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
                  <div className="border-b border-zinc-100 px-4 py-3">
                    <p className="text-sm font-medium text-zinc-900">{user.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href={user.role === "ADMIN" ? "/wox/admin" : "/account"}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 text-zinc-400" />
                      My Account
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/wox/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 text-zinc-400" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/wishlist"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Heart className="h-4 w-4 text-zinc-400" />
                      Wishlist
                    </Link>
                  </div>
                  <div className="border-t border-zinc-100 py-1">
                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Right icons */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center text-zinc-900 transition-all duration-150 hover:text-zinc-600 active:scale-90"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <NotificationBell />

            <Link
              href="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center text-zinc-900 transition-all duration-150 hover:text-zinc-600 active:scale-90"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" strokeWidth={1.5} />
              <WishlistCount />
            </Link>

            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center text-zinc-900 transition-all duration-150 hover:text-zinc-600 active:scale-90"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              <CartCount />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex w-80 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-6">
          <span className="text-lg font-bold tracking-wider text-zinc-900">WOX.11</span>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-900 transition-all duration-200 hover:bg-zinc-100 active:scale-90"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="space-y-1">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "drawer-item-hover nav-press-effect block rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.97] tap-highlight-none animate-drawer-in",
                      isActive
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 border-t border-zinc-200 pt-6">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/wishlist"
                  className={cn(
                    "drawer-item-hover nav-press-effect flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.97] tap-highlight-none animate-drawer-in",
                    pathname === "/wishlist"
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                  style={{ animationDelay: `${navLinks.length * 40}ms` }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Heart className="h-4 w-4" strokeWidth={1.5} />
                  Wishlist
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className={cn(
                    "drawer-item-hover nav-press-effect flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.97] tap-highlight-none animate-drawer-in",
                    pathname === "/cart"
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                  style={{ animationDelay: `${(navLinks.length + 1) * 40}ms` }}
                  onClick={() => setMobileOpen(false)}
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-6 border-t border-zinc-200 pt-6">
            <ul className="space-y-1">
              <li>
                {user ? (
                  <>
                    <Link
                      href={user.role === "ADMIN" ? "/wox/admin" : "/account"}
                      className={cn(
                        "drawer-item-hover nav-press-effect flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.97] tap-highlight-none animate-drawer-in",
                        (pathname === "/account" || pathname.startsWith("/wox/admin"))
                          ? "bg-zinc-900 text-white shadow-sm"
                          : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                      )}
                      style={{ animationDelay: `${(navLinks.length + 2) * 40}ms` }}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="relative">
                        <User className="h-4 w-4" strokeWidth={1.5} />
                        {isAdmin && counts.total > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-green-500 px-1 text-[8px] font-bold text-white">
                            {counts.total > 99 ? "99+" : counts.total}
                          </span>
                        )}
                      </span>
                      {user.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => { handleLogoutClick(); setMobileOpen(false); }}
                      className="nav-press-effect flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 active:scale-[0.97] tap-highlight-none animate-drawer-in"
                      style={{ animationDelay: `${(navLinks.length + 3) * 40}ms` }}
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.5} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className={cn(
                      "drawer-item-hover nav-press-effect flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.97] tap-highlight-none animate-drawer-in",
                      pathname === "/auth/login"
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                    style={{ animationDelay: `${(navLinks.length + 2) * 40}ms` }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="h-4 w-4" strokeWidth={1.5} />
                    Sign In / Register
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
