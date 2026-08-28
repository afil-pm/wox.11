"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignOutStore } from "@/lib/stores/sign-out";

export default function AccountSettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const openSignOut = useSignOutStore((s) => s.open);

  useEffect(() => {
    const stored = localStorage.getItem("wox-user");
    if (stored) {
      const user = JSON.parse(stored);
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, []);

  function handleSave() {
    const stored = localStorage.getItem("wox-user");
    if (stored) {
      const user = JSON.parse(stored);
      user.name = name;
      user.phone = phone;
      localStorage.setItem("wox-user", JSON.stringify(user));
      window.dispatchEvent(new Event("auth-change"));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/account" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Account Settings</h1>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Profile Information</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-600">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Email</label>
            <Input value={email} disabled className="mt-1 bg-zinc-50" />
            <p className="mt-1 text-xs text-zinc-400">Email cannot be changed</p>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" className="mt-1" />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} className="bg-zinc-900 text-white hover:bg-zinc-800">
            <Save className="mr-2 h-4 w-4" />
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Danger Zone</h3>
        <p className="mt-2 text-sm text-zinc-500">Sign out from your account on this device.</p>
        <Button
          variant="outline"
          className="mt-4 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => openSignOut()}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
