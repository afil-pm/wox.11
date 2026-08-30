"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/admin-api";
import { formatPrice } from "@/lib/utils";

type Coupon = {
  _id: string;
  code: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  applicableProducts: string[];
  allProducts: boolean;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    discountType: "percent" as "fixed" | "percent",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    usageLimit: "",
    active: true,
    expiresAt: "",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      const res = await adminFetch("/api/wox/admin/coupons");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const body = {
        ...(editingId ? { id: editingId } : {}),
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: Number(form.maxDiscount) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        active: form.active,
        expiresAt: form.expiresAt || null,
        allProducts: true,
      };

      const method = editingId ? "PUT" : "POST";
      const res = await adminFetch("/api/wox/admin/coupons", { method, body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed");
        return;
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchCoupons();
    } catch {
      alert("Failed to save coupon");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon?")) return;
    try {
      await adminFetch(`/api/wox/admin/coupons?id=${id}`, { method: "DELETE" });
      fetchCoupons();
    } catch {
      // silent
    }
  }

  function handleEdit(coupon: Coupon) {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: String(coupon.minOrderAmount),
      maxDiscount: String(coupon.maxDiscount),
      usageLimit: String(coupon.usageLimit),
      active: coupon.active,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm({ code: "", discountType: "percent", discountValue: "", minOrderAmount: "", maxDiscount: "", usageLimit: "", active: true, expiresAt: "" });
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coupon Codes</h1>
          <p className="text-sm text-gray-500">Manage discount coupons for your store</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 mb-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit Coupon" : "New Coupon"}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as "fixed" | "percent" })} className="w-full border rounded px-3 py-2 text-sm">
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount Value</label>
              <Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder={form.discountType === "percent" ? "e.g. 10" : "e.g. 50"} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Order Amount (₹)</label>
              <Input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Discount (₹)</label>
              <Input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="0 = no limit" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Usage Limit</label>
              <Input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="0 = unlimited" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expires At</label>
              <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4" />
              <span className="text-sm">Active</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={!form.code || !form.discountValue}>
              <Check className="mr-2 h-4 w-4" /> {editingId ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Tag className="mx-auto h-12 w-12 mb-4" />
          <p>No coupons created yet</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Discount</th>
                <th className="text-left p-3 font-medium">Min Order</th>
                <th className="text-left p-3 font-medium">Uses</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Expires</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id} className="border-t">
                  <td className="p-3 font-mono font-bold">{c.code}</td>
                  <td className="p-3">{c.discountType === "percent" ? `${c.discountValue}%` : formatPrice(c.discountValue)}</td>
                  <td className="p-3">{c.minOrderAmount > 0 ? formatPrice(c.minOrderAmount) : "—"}</td>
                  <td className="p-3">{c.usageLimit > 0 ? `${c.usedCount}/${c.usageLimit}` : c.usedCount}</td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleEdit(c)} className="p-1 hover:bg-gray-100 rounded mr-1"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(c._id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
