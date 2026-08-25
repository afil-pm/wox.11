"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Package,
  Shield,
  LogOut,
  ChevronRight,
  Edit2,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Section = "profile" | "orders" | "security" | "logout";

interface Order {
  id: string;
  date: string;
  status: string;
  statusVariant: "default" | "success" | "secondary";
  items: number;
  total: number;
}

const orders: Order[] = [
  {
    id: "WOX-784521",
    date: "Aug 20, 2026",
    status: "Shipped",
    statusVariant: "default",
    items: 3,
    total: 3497,
  },
  {
    id: "WOX-784520",
    date: "Aug 15, 2026",
    status: "Delivered",
    statusVariant: "success",
    items: 1,
    total: 1199,
  },
  {
    id: "WOX-784519",
    date: "Aug 10, 2026",
    status: "Delivered",
    statusVariant: "success",
    items: 2,
    total: 2398,
  },
];

const navItems = [
  { key: "profile" as Section, label: "Profile", icon: User },
  { key: "orders" as Section, label: "Orders", icon: Package },
  { key: "security" as Section, label: "Security", icon: Shield },
  { key: "logout" as Section, label: "Logout", icon: LogOut },
];

export default function AccountPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const getInitialSection = (): Section => {
    if (tabParam === "orders") return "orders";
    if (tabParam === "security") return "security";
    return "profile";
  };

  const [activeSection, setActiveSection] = useState<Section>(getInitialSection);

  useEffect(() => {
    if (tabParam === "orders") setActiveSection("orders");
    else if (tabParam === "security") setActiveSection("security");
    else setActiveSection("profile");
  }, [tabParam]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">
        My Account
      </h1>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar */}
        <nav className="w-full shrink-0 md:w-56">
          <div className="flex flex-row gap-1 overflow-x-auto rounded-lg border border-zinc-200 p-1 md:flex-col md:overflow-visible">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={cn(
                  "flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  activeSection === item.key
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {activeSection === "profile" && <ProfileSection />}
          {activeSection === "orders" && <OrdersSection />}
          {activeSection === "security" && <SecuritySection />}
          {activeSection === "logout" && <LogoutSection />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Rahul Sharma");
  const [email, setEmail] = useState("rahul@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Profile</h2>
        {!editing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="gap-1.5"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Name</label>
          {editing ? (
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          ) : (
            <p className="text-sm text-zinc-900">{name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Email</label>
          {editing ? (
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          ) : (
            <p className="text-sm text-zinc-900">{email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Phone</label>
          {editing ? (
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          ) : (
            <p className="text-sm text-zinc-900">{phone}</p>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-6 flex gap-3">
          <Button
            onClick={() => setEditing(false)}
            className="bg-zinc-900 text-white hover:bg-zinc-800"
          >
            Save Changes
          </Button>
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

function OrdersSection() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold text-zinc-900">Orders</h2>

      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-lg border border-zinc-100 p-4 transition-colors hover:bg-zinc-50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900">
                  {order.id}
                </span>
                <Badge variant={order.statusVariant}>{order.status}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-500">
                <span>{order.date}</span>
                <span>
                  {order.items} {order.items === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-zinc-900">
                {formatPrice(order.total)}
              </span>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold text-zinc-900">
        Change Password
      </h2>

      <div className="max-w-md space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">
            Current Password
          </label>
          <Input type="password" placeholder="Enter current password" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">
            New Password
          </label>
          <Input type="password" placeholder="Enter new password" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">
            Confirm Password
          </label>
          <Input type="password" placeholder="Confirm new password" />
        </div>

        <Button className="bg-zinc-900 text-white hover:bg-zinc-800">
          Update Password
        </Button>
      </div>
    </div>
  );
}

function LogoutSection() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="mb-2 text-lg font-semibold text-zinc-900">Logout</h2>
      <p className="mb-6 text-sm text-zinc-500">
        Are you sure you want to logout?
      </p>
      <Button variant="destructive" className="gap-1.5">
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
