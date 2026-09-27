"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import WoxLoader from "@/components/ui/wox-loader";
import { supplierFetch } from "@/lib/supplier-api";

interface SupplierProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number;
  sku: string;
  category: { name: string; slug: string } | null;
  images: { url: string }[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
}

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<SupplierProduct[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    try {
      const res = await supplierFetch(
        `/api/wox/supplier/products${query ? `?search=${encodeURIComponent(query)}` : ""}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load products");
        return;
      }
      setProducts(data.products ?? []);
    } catch {
      setError("Failed to load products");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await supplierFetch(`/api/wox/supplier/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => (prev || []).filter((p) => p.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete product");
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Products</h1>
          <p className="mt-1 text-sm text-zinc-500">Only your own products are listed here.</p>
        </div>
        <Link href="/wox/supplier/products/new">
          <Button className="bg-zinc-900 text-white hover:bg-zinc-800">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU"
          className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {products === null ? (
        <div className="flex h-48 items-center justify-center">
          <WoxLoader />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center">
          <p className="text-sm text-zinc-500">No products yet.</p>
          <Link href="/wox/supplier/products/new" className="mt-3 inline-block">
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800">
              <Plus className="mr-2 h-4 w-4" /> Add your first product
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                        {product.images?.[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{product.name}</p>
                        <p className="text-xs text-zinc-500">
                          {product.category?.name || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{product.sku}</td>
                  <td className="px-4 py-3 text-zinc-900">
                    ₹{(product.salePrice || product.basePrice).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        product.stock > 5
                          ? "text-zinc-700"
                          : product.stock > 0
                          ? "text-orange-600"
                          : "text-red-600"
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/wox/supplier/products/${product.id}/edit`}
                        className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                        className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
