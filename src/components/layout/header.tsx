"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Search, User, Heart, ShoppingBag, Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchModal from "@/components/search/search-modal";

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
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

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

  const handleLogout = () => {
    localStorage.removeItem("wox-user");
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/";
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
    return () => {
      document.body.style.overflow = "";
    };
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
            className="relative -ml-0.5 mr-2 flex h-10 w-10 items-center justify-center text-zinc-900 lg:hidden"
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
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop: Right icons */}
          <div className="hidden items-center gap-1 lg:flex lg:gap-2">
            {/* Search */}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center text-zinc-900 transition-colors hover:text-zinc-600"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>

            {/* Account / Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={user.role === "ADMIN" ? "/admin" : "/account"}
                  className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                  <span className="hidden xl:inline">{user.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center text-zinc-500 transition-colors hover:text-red-600"
                  aria-label="Logout"
                >
                  <LogOut className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex h-10 w-10 items-center justify-center text-zinc-900 transition-colors hover:text-zinc-600"
                aria-label="Account"
              >
                <User className="h-5 w-5" strokeWidth={1.5} />
              </Link>
            )}

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center text-zinc-900 transition-colors hover:text-zinc-600"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" strokeWidth={1.5} />
              <WishlistCount />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center text-zinc-900 transition-colors hover:text-zinc-600"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              <CartCount />
            </Link>
          </div>

          {/* Mobile: Right icons */}
          <div className="flex items-center gap-1 lg:hidden">
            {/* Search */}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center text-zinc-900 transition-colors hover:text-zinc-600"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center text-zinc-900 transition-colors hover:text-zinc-600"
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
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Drawer header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-6">
          <span className="text-lg font-bold tracking-wider text-zinc-900">
            WOX.11
          </span>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center text-zinc-900"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-zinc-200 pt-6">
            <ul className="space-y-1">
              <li>
                {user ? (
                  <>
                    <Link
                      href={user.role === "ADMIN" ? "/admin" : "/account"}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                      onClick={() => setMobileOpen(false)}
                    >
                      <User className="h-4 w-4" strokeWidth={1.5} />
                      {user.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.5} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="h-4 w-4" strokeWidth={1.5} />
                    Sign In / Register
                  </Link>
                )}
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                  onClick={() => setMobileOpen(false)}
                >
                  <Heart className="h-4 w-4" strokeWidth={1.5} />
                  Wishlist
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                  onClick={() => setMobileOpen(false)}
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                  Cart
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
