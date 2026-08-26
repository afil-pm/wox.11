"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, X, ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/admin-api";
import PremiumSelect from "@/components/ui/premium-select";

type Category = { _id: string; id: string; name: string; slug: string; gender: string; type: string };
type ProductData = {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  salePrice: number | null;
  sku: string;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  source: "static" | "mongo";
  images: { url: string; alt: string | null }[];
  variants: { name: string; color: string; colorCode: string; sizes: { name: string; quantity: number }[] }[];
};

interface SizeInput { name: string; quantity: number; }
interface VariantInput { name: string; color: string; sizes: SizeInput[]; }

const defaultSizes: SizeInput[] = [
  { name: "S", quantity: 0 },
  { name: "M", quantity: 0 },
  { name: "L", quantity: 0 },
  { name: "XL", quantity: 0 },
  { name: "XXL", quantity: 0 },
];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ url: string; alt: string | null }[]>([]);
  const [variants, setVariants] = useState<VariantInput[]>([
    { name: "Default", color: "", sizes: [...defaultSizes] },
  ]);
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
    async function load() {
      try {
        const [productRes, catRes] = await Promise.all([
          adminFetch(`/api/admin/products?search=`),
          adminFetch("/api/admin/categories"),
        ]);
        const catData = await catRes.json();
        setCategories(catData.categories ?? []);

        const pData = await productRes.json();
        const product = pData.products?.find((p: ProductData) => p.id === id);
        if (!product) throw new Error("Product not found");
        if (product.source === "static") throw new Error("This is a static product and cannot be edited.");

        setFormData({
          name: product.name,
          description: product.description ?? "",
          basePrice: String(product.basePrice),
          salePrice: product.salePrice != null && product.salePrice > 0 ? String(product.salePrice) : "",
          sku: product.sku,
          categoryId: product.categoryId ?? "",
          isFeatured: product.isFeatured,
          isActive: product.isActive,
        });
        setExistingImages(product.images ?? []);
        if (product.variants && product.variants.length > 0) {
          setVariants(product.variants.map((v: { name: string; color: string; sizes: { name: string; quantity: number }[] }) => ({
            name: v.name,
            color: v.color,
            sizes: v.sizes.length > 0 ? v.sizes : [...defaultSizes],
          })));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewImage(index: number) {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof VariantInput, value: string) {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  }

  function updateVariantSize(variantIdx: number, sizeIdx: number, field: keyof SizeInput, value: string | number) {
    setVariants((prev) => prev.map((v, i) => {
      if (i !== variantIdx) return v;
      return { ...v, sizes: v.sizes.map((s, j) => j === sizeIdx ? { ...s, [field]: value } : s) };
    }));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { name: `Variant ${prev.length + 1}`, color: "", sizes: [...defaultSizes] }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const allImages = [
        ...existingImages.map((img, i) => ({ url: img.url, alt: img.alt || formData.name, position: i })),
        ...imagePreviews.map((url, i) => ({ url, alt: formData.name, position: existingImages.length + i })),
      ];
      const body: Record<string, unknown> = {
        id,
        name: formData.name,
        description: formData.description || undefined,
        basePrice: Number(formData.basePrice),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        sku: formData.sku,
        categoryId: formData.categoryId,
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        images: allImages,
        variants: variants.filter((v) => v.name).map((v) => ({
          name: v.name,
          color: v.color,
          colorCode: "",
          sizes: v.sizes.filter((s) => s.quantity > 0 || s.name),
        })),
      };
      const res = await adminFetch("/api/admin/products", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-sm text-gray-500">Update product information</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading product...</div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : (
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
                className="flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
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
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <PremiumSelect
                  value={formData.categoryId}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, categoryId: val }))}
                  options={categories.map((cat) => ({ label: `${cat.name} (${cat.gender})`, value: cat._id || cat.id }))}
                  placeholder="Select category"
                />
              </div>
            </div>

            {/* Variants & Sizes */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Variants & Stock</label>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="mr-1 h-3 w-3" /> Add Variant
                </Button>
              </div>
              <div className="space-y-4">
                {variants.map((variant, vi) => (
                  <div key={vi} className="rounded-lg border border-zinc-200 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <Input value={variant.name} onChange={(e) => updateVariant(vi, "name", e.target.value)} placeholder="Variant name" className="flex-1" />
                      <Input value={variant.color} onChange={(e) => updateVariant(vi, "color", e.target.value)} placeholder="Color" className="w-32" />
                      {variants.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(vi)} className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {variant.sizes.map((size, si) => (
                        <div key={si}>
                          <label className="mb-1 block text-xs text-gray-500">{size.name}</label>
                          <Input type="number" min="0" value={size.quantity || ""} onChange={(e) => updateVariantSize(vi, si, "quantity", Number(e.target.value))} placeholder="0" className="h-9 text-center" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Product Images</label>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              {(existingImages.length > 0 || imagePreviews.length > 0) && (
                <div className="mb-3 flex flex-wrap gap-3">
                  {existingImages.map((img, i) => (
                    <div key={`existing-${i}`} className="group relative h-24 w-24 overflow-hidden rounded-lg border bg-gray-50">
                      <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(i)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.map((src, i) => (
                    <div key={`new-${i}`} className="group relative h-24 w-24 overflow-hidden rounded-lg border bg-gray-50">
                      <img src={src} alt={`New ${i + 1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeNewImage(i)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
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
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Updating..." : "Update Product"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/products">Cancel</Link>
              </Button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
