"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.user.role !== "ADMIN") {
        setError("Access denied. Admin credentials required.");
        return;
      }

      localStorage.setItem("wox-user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-change"));
      router.push("/admin");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Admin Panel</h1>
            <p className="mt-2 text-sm text-zinc-500">Sign in to manage your store</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                placeholder="wox@admin.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Admin Sign In
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link href="/" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
              Back to Store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}