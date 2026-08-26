"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = { _id: string; name: string; slug: string };

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    salePrice: "",
    sku: "",
    categoryId: "",
    isFeatured: false,
    isActive: true,
  });

  useEffect(() => {
    fetch("/api/mongo/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {});
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = {
        name: formData.name,
        description: formData.description || undefined,
        basePrice: Number(formData.basePrice),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        sku: formData.sku,
        categoryId: formData.categoryId,
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
      };
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-sm text-gray-500">Create a new product listing</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Product Name</label>
            <Input name="name" value={formData.name} onChange={handleChange} placeholder="Enter product name" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter product description"
              rows={4}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Base Price (₹)</label>
              <Input name="basePrice" type="number" value={formData.basePrice} onChange={handleChange} placeholder="0" min="1" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sale Price (₹)</label>
              <Input name="salePrice" type="number" value={formData.salePrice} onChange={handleChange} placeholder="0" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">SKU</label>
              <Input name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g. WOX-SHT-001" required />
              <p className="mt-1 text-xs text-gray-400">Uppercase letters, numbers, and hyphens only</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Product Images</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
            {imagePreviews.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg border bg-gray-50">
                    <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="mr-2 h-4 w-4" />
              {imagePreviews.length > 0 ? "Add More Images" : "Upload Images"}
            </Button>
            <p className="mt-1 text-xs text-gray-400">Upload product photos (JPEG, PNG, WebP)</p>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm font-medium text-gray-700">Featured</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex items-center gap-3 border-t pt-4">
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Product"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/products">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
