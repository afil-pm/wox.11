"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowLeft,
  Search,
  Plus,
  Edit2,
  Trash2,
  Menu,
  X,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatPrice } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", active: false },
  { label: "Products", icon: Package, href: "/admin/products", active: true },
  { label: "Orders", icon: ShoppingCart, href: "/admin/orders", active: false },
];

type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  category: { name: string };
  images: { url: string; alt: string | null }[];
  variants: {
    sizes: { inventory: { quantity: number } | null }[];
  }[];
};

type FilterStatus = "all" | "active" | "inactive" | "low-stock";

const filterLabels: Record<FilterStatus, string> = {
  all: "All",
  active: "Active",
  inactive: "Inactive",
  "low-stock": "Low Stock",
};

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-600",
  "low-stock": "bg-yellow-100 text-yellow-800",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  "low-stock": "Low Stock",
};

function getStatus(product: ApiProduct): string {
  if (!product.isActive) return "inactive";
  const totalStock = product.variants.reduce(
    (sum, v) => sum + v.sizes.reduce((s2, sz) => s2 + (sz.inventory?.quantity ?? 0), 0),
    0
  );
  if (totalStock === 0) return "inactive";
  if (totalStock <= 10) return "low-stock";
  return "active";
}

function getTotalStock(product: ApiProduct): number {
  return product.variants.reduce(
    (sum, v) => sum + v.sizes.reduce((s2, sz) => s2 + (sz.inventory?.quantity ?? 0), 0),
    0
  );
}

export default function AdminProductsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/products?${params}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        if (!cancelled) setProducts(data.products);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [search]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
    } catch {
      alert("Failed to delete product");
    }
  }

  const filteredProducts = products.filter((p) => {
    const status = getStatus(p);
    const matchesFilter = filter === "all" || status === filter;
    return matchesFilter;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-zinc-900 text-white transition-transform duration-200 lg:static lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">WOX.11</Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", item.active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white")}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-800 p-3">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
            Back to Store
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="ml-4 flex-1 lg:ml-0" />
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">A</div>
              <span className="hidden text-sm font-medium md:block">Admin</span>
              <ChevronDown className="hidden h-4 w-4 text-gray-500 md:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-500">Manage your product inventory</p>
            </div>
            <Button asChild>
              <Link href="/admin/products/new"><Plus className="mr-2 h-4 w-4" />Add Product</Link>
            </Button>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {(Object.keys(filterLabels) as FilterStatus[]).map((key) => (
                <button key={key} onClick={() => setFilter(key)} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition-colors", filter === key ? "bg-zinc-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border")}>
                  {filterLabels[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading products...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-red-500">{error}</td></tr>
                  ) : filteredProducts.map((product) => {
                    const status = getStatus(product);
                    const stock = getTotalStock(product);
                    const image = product.images[0]?.url;
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {image && <img src={image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />}
                            <div>
                              <span className="font-medium text-gray-900">{product.name}</span>
                              <p className="text-xs text-gray-400">{product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{product.category.name}</td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-medium text-gray-900">{formatPrice(product.salePrice ?? product.basePrice)}</span>
                            {product.salePrice && <span className="ml-1 text-xs text-gray-400 line-through">{formatPrice(product.basePrice)}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("font-medium", stock === 0 ? "text-red-600" : stock <= 10 ? "text-yellow-600" : "text-gray-900")}>{stock}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn(statusStyles[status])}>{statusLabels[status]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/admin/products/${product.id}/edit`}><Edit2 className="h-4 w-4" /></Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(deleteConfirmId === product.id ? null : product.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          {deleteConfirmId === product.id && (
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <span className="text-xs text-gray-500">Delete?</span>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>Yes</Button>
                              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>No</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {!loading && filteredProducts.length === 0 && (
            <div className="mt-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">No products found</p>
              <p className="text-xs text-gray-400">Try adjusting your search or filter</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
