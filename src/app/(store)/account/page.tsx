"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Package, Heart, MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("wox-user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("wox-user");
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("wox-user");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <User className="mx-auto h-16 w-16 text-zinc-300" />
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">Sign In Required</h1>
          <p className="mt-2 text-sm text-zinc-500">Please sign in to view your account</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/auth/login">
              <Button className="bg-zinc-900 text-white hover:bg-zinc-800">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline">Create Account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-900">My Account</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-zinc-900">{user.name}</h2>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <span className="mt-2 inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              {user.role}
            </span>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="mt-6 w-full text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Package, label: "My Orders", desc: "Track your orders", href: "/account/orders" },
              { icon: Heart, label: "Wishlist", desc: "Your saved items", href: "/wishlist" },
              { icon: MapPin, label: "Addresses", desc: "Manage addresses", href: "/account/addresses" },
              { icon: Settings, label: "Settings", desc: "Account preferences", href: "/account/settings" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100">
                  <item.icon className="h-5 w-5 text-zinc-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
