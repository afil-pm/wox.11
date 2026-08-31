"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

const CartBadge = dynamic(
  () =>
    import("@/lib/stores/cart").then((mod) => {
      const { default: useCartStore } = mod;
      return function CartBadgeInner() {
        const totalItems = useCartStore((s) => s.totalItems);
        if (totalItems === 0) return null;
        return (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-medium text-white">
            {totalItems}
          </span>
        );
      };
    }),
  { ssr: false }
);

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Cart", href: "/cart", icon: ShoppingBag },
  { label: "Account", href: "/account", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-zinc-200 bg-white/80 backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group/nav relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 tap-highlight-none",
                "transition-all duration-200 active:scale-90",
                isActive ? "text-zinc-900" : "text-zinc-400"
              )}
            >
              {/* Active pill background */}
              <span
                className={cn(
                  "absolute top-0.5 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full transition-all duration-300 ease-out",
                  isActive
                    ? "bg-zinc-100 scale-100 opacity-100"
                    : "bg-transparent scale-75 opacity-0 group-active/nav:scale-100 group-active/nav:bg-zinc-100 group-active/nav:opacity-100"
                )}
              />

              <span className="relative z-10">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    "group-active/nav:scale-125",
                    isActive ? "stroke-[2.2]" : "stroke-[1.5]"
                  )}
                />
                {item.label === "Cart" && <CartBadge />}
              </span>

              <span
                className={cn(
                  "relative z-10 text-[10px] font-medium transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-70 group-active/nav:opacity-100"
                )}
              >
                {item.label}
              </span>

              {/* Underline that expands from center */}
              <span
                className={cn(
                  "absolute bottom-1 left-1/2 h-0.5 -translate-x-1/2 rounded-full transition-all duration-300 ease-out",
                  isActive
                    ? "w-5 bg-zinc-900"
                    : "w-0 bg-zinc-400 group-active/nav:w-5 group-active/nav:bg-zinc-400"
                )}
              />
            </Link>
          );
        })}
      </div>

      {/* Safe area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
