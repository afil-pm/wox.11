"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Edit2, Trash2, Database, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatPrice } from "@/lib/utils";
import { adminFetch } from "@/lib/admin-api";

type ProductVariant = {
  name: string;
  color: string | null;
  colorCode: string | null;
  sizes: { name: string; quantity: number }[];
};

type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  basePrice: number;
  salePrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  category: { name: string; slug: string; gender: string; type: string };
  categoryId: string | null;
  images: { url: string; alt: string | null; position?: number }[];
  variants: ProductVariant[];
  source: "static" | "mongo";
  createdAt: string;
};

type FilterStatus = "all" | "active" | "inactive" | "low-stock";

const filterLabels: Record<FilterStatus, string> = {
  all: "All",
  active: "Active",
  inactive: "Inactive",
  "low-stock": "Low Stock",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await adminFetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await adminFetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silently fail
    }
    setDeleteId(null);
  }

  function totalStock(p: ApiProduct) {
    return p.variants.reduce(
      (sum, v) => sum + v.sizes.reduce((s, sz) => s + (sz.quantity ?? 0), 0),
      0
    );
  }

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "active") return p.isActive;
    if (filter === "inactive") return !p.isActive;
    if (filter === "low-stock") return totalStock(p) < 10;
    return true;
  });

  const staticCount = products.filter((p) => p.source === "static").length;
  const mongoCount = products.filter((p) => p.source === "mongo").length;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">
            {products.length} total &middot; {staticCount} static &middot; {mongoCount} in database
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(Object.keys(filterLabels) as FilterStatus[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === key
                  ? "bg-zinc-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {filterLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading products...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No products found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                <th className="p-4">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Source</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((product) => {
                const stock = totalStock(product);
                const isMongo = product.source === "mongo";
                return (
                  <tr key={product.id} className={cn("hover:bg-gray-50", !isMongo && "bg-gray-50/50")}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                          {product.images[0] ? (
                            <img src={product.images[0].url} alt={product.images[0].alt ?? product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">No img</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.isFeatured && (
                            <Badge variant="secondary" className="mt-0.5 text-[10px]">Featured</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-500">{product.sku}</td>
                    <td className="p-4 text-gray-600">{product.category.name}</td>
                    <td className="p-4">
                      {product.salePrice && product.salePrice > 0 ? (
                        <div>
                          <span className="font-medium text-gray-900">{formatPrice(product.salePrice)}</span>
                          <span className="ml-1 text-xs text-gray-400 line-through">{formatPrice(product.basePrice)}</span>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">{formatPrice(product.basePrice)}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={cn("font-medium", stock < 10 ? "text-red-600" : "text-gray-900")}>
                        {stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] gap-1",
                          isMongo ? "border-green-200 text-green-700 bg-green-50" : "border-blue-200 text-blue-700 bg-blue-50"
                        )}
                      >
                        {isMongo ? <Database className="h-2.5 w-2.5" /> : <FileCode className="h-2.5 w-2.5" />}
                        {isMongo ? "DB" : "Static"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isMongo ? (
                          <>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/products/${product.id}/edit`}>
                                <Edit2 className="h-4 w-4" />
                              </Link>
                            </Button>
                            {deleteId === product.id ? (
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-700">
                                  Confirm
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => setDeleteId(product.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Read-only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
