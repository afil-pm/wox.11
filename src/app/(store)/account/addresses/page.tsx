"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Trash2, Plus, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SavedAddress = {
  id: string;
  name: string;
  phone: string;
  house: string;
  street: string;
  town: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  landmark: string;
};

const emptyAddress: SavedAddress = {
  id: "",
  name: "",
  phone: "",
  house: "",
  street: "",
  town: "",
  district: "",
  state: "",
  country: "India",
  pincode: "",
  landmark: "",
};

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

export function getSavedAddresses(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("wox-addresses");
  return stored ? JSON.parse(stored) : [];
}

export function saveSavedAddresses(addrs: SavedAddress[]) {
  localStorage.setItem("wox-addresses", JSON.stringify(addrs));
}

export function addressToOrderAddress(addr: SavedAddress) {
  const parts = [addr.street, addr.district].filter(Boolean);
  return {
    name: addr.name,
    phone: addr.phone,
    line1: addr.house,
    line2: parts.join(", "),
    city: addr.town,
    state: addr.state,
    pincode: addr.pincode,
    landmark: addr.landmark,
  };
}

export function formatAddressShort(addr: SavedAddress): string {
  const parts = [addr.house, addr.street, addr.town, addr.state, addr.pincode].filter(Boolean);
  return parts.join(", ");
}

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SavedAddress>(emptyAddress);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAddresses(getSavedAddresses());
    setMounted(true);
  }, []);

  function persistAddresses(addrs: SavedAddress[]) {
    setAddresses(addrs);
    saveSavedAddresses(addrs);
  }

  function handleSave() {
    if (!form.name || !form.phone || !form.house || !form.town || !form.state || !form.pincode) return;
    if (editingId) {
      persistAddresses(addresses.map((a) => (a.id === editingId ? { ...form, id: editingId } : a)));
    } else {
      const newAddr = { ...form, id: `addr-${Date.now()}` };
      persistAddresses([...addresses, newAddr]);
    }
    setForm(emptyAddress);
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(addr: SavedAddress) {
    setForm(addr);
    setEditingId(addr.id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    persistAddresses(addresses.filter((a) => a.id !== id));
  }

  async function handlePincodeLookup(pincode: string) {
    setForm((prev) => ({ ...prev, pincode, town: "", state: "", district: "" }));
    if (pincode.length !== 6) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setForm((prev) => ({
          ...prev,
          town: po.Division || po.District || "",
          district: po.District || "",
          state: po.State || "",
        }));
      }
    } catch { /* silent */ } finally {
      setPincodeLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
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
          <p className="mt-2 text-sm text-zinc-500">Add an address for faster checkout next time.</p>
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
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900">{addr.name}</p>
                    <p className="mt-1 text-sm text-zinc-600">{addr.house}</p>
                    {addr.street && <p className="text-sm text-zinc-500">{addr.street}</p>}
                    {addr.district && <p className="text-sm text-zinc-500">{addr.district}</p>}
                    <p className="text-sm text-zinc-500">
                      {addr.town}{addr.state ? `, ${addr.state}` : ""} - {addr.pincode}
                    </p>
                    <p className="text-sm text-zinc-500">{addr.country}</p>
                    <p className="text-xs text-zinc-400">Phone: {addr.phone}</p>
                    {addr.landmark && <p className="text-xs text-zinc-400">Landmark: {addr.landmark}</p>}
                  </div>
                  <div className="flex flex-col gap-2 ml-2">
                    <button onClick={() => handleEdit(addr)} className="text-zinc-400 hover:text-zinc-700">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(addr.id)} className="text-zinc-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!showForm && (
            <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyAddress); }} variant="outline" className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Add Another
            </Button>
          )}
        </>
      )}

      {showForm && (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">{editingId ? "Edit Address" : "New Address"}</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-600">Full Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Recipient name" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Phone *</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="10-digit mobile" className="mt-1" maxLength={10} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600">House / Flat / Building *</label>
              <Input value={form.house} onChange={(e) => setForm({ ...form, house: e.target.value })} placeholder="e.g. 204, Skyline Apartments" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600">Street / Locality / Area</label>
              <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="e.g. MG Road, Sector 5 (optional)" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Pincode *</label>
              <div className="relative mt-1">
                <Input
                  value={form.pincode}
                  onChange={(e) => handlePincodeLookup(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
                {pincodeLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Town / City *</label>
              <Input value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} placeholder={pincodeLoading ? "Fetching..." : "Town or City"} className="mt-1" readOnly={pincodeLoading} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">District</label>
              <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="District (optional)" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">State *</label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{pincodeLoading ? "Fetching..." : "Select state"}</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Country *</label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="India" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Landmark</label>
              <Input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder="Near temple, school (optional)" className="mt-1" />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <Button onClick={handleSave} className="bg-zinc-900 text-white hover:bg-zinc-800">
              <Check className="mr-1 h-4 w-4" />
              {editingId ? "Update Address" : "Save Address"}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyAddress); }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
