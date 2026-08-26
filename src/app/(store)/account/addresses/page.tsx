"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
};

const emptyAddress: Address = {
  id: "",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
};

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("wox-addresses");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAddress);

  function saveAddresses(addrs: Address[]) {
    setAddresses(addrs);
    localStorage.setItem("wox-addresses", JSON.stringify(addrs));
  }

  function handleAdd() {
    if (!form.name || !form.phone || !form.line1 || !form.city || !form.state || !form.pincode) return;
    const newAddr = { ...form, id: `addr-${Date.now()}` };
    saveAddresses([...addresses, newAddr]);
    setForm(emptyAddress);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    saveAddresses(addresses.filter((a) => a.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/account" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">My Addresses</h1>
      </div>

      {addresses.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <MapPin className="mx-auto h-12 w-12 text-zinc-300" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900">No addresses saved</h2>
          <p className="mt-2 text-sm text-zinc-500">Add an address for faster checkout.</p>
          <Button onClick={() => setShowForm(true)} className="mt-6 bg-zinc-900 text-white hover:bg-zinc-800">
            <Plus className="mr-2 h-4 w-4" /> Add Address
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((addr) => (
              <div key={addr.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-zinc-900">{addr.name}</p>
                    <p className="text-sm text-zinc-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                    <p className="text-sm text-zinc-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-sm text-zinc-500">Phone: {addr.phone}</p>
                    {addr.landmark && <p className="text-xs text-zinc-400">Landmark: {addr.landmark}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!showForm && (
            <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Add Another
            </Button>
          )}
        </>
      )}

      {showForm && (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">New Address</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-600">Full Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Phone *</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600">Address Line 1 *</label>
              <Input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="House no., Building, Street" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600">Address Line 2</label>
              <Input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} placeholder="Area, Colony (optional)" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">City *</label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">State *</label>
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Pincode *</label>
              <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="6-digit pincode" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Landmark</label>
              <Input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder="Near (optional)" className="mt-1" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={handleAdd} className="bg-zinc-900 text-white hover:bg-zinc-800">Save Address</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setForm(emptyAddress); }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
