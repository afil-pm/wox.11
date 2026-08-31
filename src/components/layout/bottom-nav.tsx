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
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-zinc-200 bg-white lg:hidden">
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
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200 active:scale-95 tap-highlight-none",
                isActive ? "text-zinc-900" : "text-zinc-400"
              )}
            >
              <span className="relative">
                <Icon
                  className="h-5 w-5"
                  strokeWidth={isActive ? 2.2 : 1.5}
                />
                {item.label === "Cart" && <CartBadge />}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Safe area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
