"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, X, ImagePlus, Plus, Trash2, Star, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/admin-api";
import PremiumSelect from "@/components/ui/premium-select";

type Category = { _id: string; name: string; slug: string; gender: string; type: string };

interface SizeInput {
  name: string;
  quantity: number;
}

interface VariantInput {
  name: string;
  color: string;
  sizes: SizeInput[];
}

const defaultSizes: SizeInput[] = [
  { name: "S", quantity: 0 },
  { name: "M", quantity: 0 },
  { name: "L", quantity: 0 },
  { name: "XL", quantity: 0 },
  { name: "XXL", quantity: 0 },
];

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
    store: "",
    averageRating: "0",
    reviewCount: "0",
    isFeatured: false,
    isActive: true,
  });
  const [seo, setSeo] = useState({
    metaTitle: "",
    metaDescription: "",
    keywords: [] as string[],
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    noindex: false,
  });
  const [taxData, setTaxData] = useState({
    hsnCode: "6211",
    gstRate: 5,
    taxCategory: "apparel",
    taxInclusive: true,
  });
  const [specifications, setSpecifications] = useState<{ label: string; value: string }[]>([]);
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    adminFetch("/api/mongo/categories")
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
    setLoading(true);
    setError(null);
    try {
      const imageUrls = imagePreviews.map((url, i) => ({ url, alt: formData.name, position: i }));
      const body = {
        name: formData.name,
        description: formData.description || undefined,
        basePrice: Number(formData.basePrice),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        sku: formData.sku,
        categoryId: formData.categoryId,
        store: formData.store,
        averageRating: Number(formData.averageRating) || 0,
        reviewCount: Number(formData.reviewCount) || 0,
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        images: imageUrls,
        variants: variants.filter((v) => v.name).map((v) => ({
          name: v.name,
          color: v.color,
          colorCode: "",
          sizes: v.sizes.filter((s) => s.quantity > 0 || s.name),
        })),
        seo: {
          metaTitle: seo.metaTitle || undefined,
          metaDescription: seo.metaDescription || undefined,
          keywords: seo.keywords.length > 0 ? seo.keywords : undefined,
          ogTitle: seo.ogTitle || undefined,
          ogDescription: seo.ogDescription || undefined,
          ogImage: seo.ogImage || undefined,
          noindex: seo.noindex,
        },
        tax: taxData,
        specifications: specifications.filter((s) => s.label.trim() && s.value.trim()),
      };
      const res = await adminFetch("/api/wox/admin/products", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let data: Record<string, unknown>;
      try { data = JSON.parse(text); } catch { data = { error: text }; }
      if (!res.ok) throw new Error(String(data.error || "Failed to create product"));
      router.push("/wox/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product. Check all fields and try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalStock = variants.reduce((sum, v) => sum + v.sizes.reduce((s, sz) => s + sz.quantity, 0), 0);

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
              <p className="mt-1 text-xs text-gray-400">Uppercase letters, numbers, and hyphens only</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <PremiumSelect
                value={formData.categoryId}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, categoryId: val }))}
                options={categories.map((cat) => ({ label: `${cat.name} (${cat.gender})`, value: cat._id }))}
                placeholder="Select category"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Store</label>
            <Input name="store" value={formData.store} onChange={handleChange} placeholder="e.g. WOX Main Store, WOX Outlet" />
            <p className="mt-1 text-xs text-gray-400">Assign this product to a store location</p>
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
                    <Input
                      value={variant.name}
                      onChange={(e) => updateVariant(vi, "name", e.target.value)}
                      placeholder="Variant name"
                      className="flex-1"
                    />
                    <Input
                      value={variant.color}
                      onChange={(e) => updateVariant(vi, "color", e.target.value)}
                      placeholder="Color"
                      className="w-32"
                    />
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
                        <Input
                          type="number"
                          min="0"
                          value={size.quantity || ""}
                          onChange={(e) => updateVariantSize(vi, si, "quantity", Number(e.target.value))}
                          placeholder="0"
                          className="h-9 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-2 text-xs text-gray-400">Total stock: {totalStock} units across all sizes</p>
          </div>

          {/* Specifications */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListPlus className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Specifications</label>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setSpecifications((prev) => [...prev, { label: "", value: "" }])}>
                <Plus className="mr-1 h-3 w-3" /> Add Spec
              </Button>
            </div>
            {specifications.length > 0 && (
              <div className="space-y-2">
                {specifications.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={spec.label}
                      onChange={(e) => setSpecifications((prev) => prev.map((s, j) => j === i ? { ...s, label: e.target.value } : s))}
                      placeholder="Label (e.g. Material)"
                      className="w-1/3"
                    />
                    <Input
                      value={spec.value}
                      onChange={(e) => setSpecifications((prev) => prev.map((s, j) => j === i ? { ...s, value: e.target.value } : s))}
                      placeholder="Value (e.g. 100% Cotton)"
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSpecifications((prev) => prev.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-400">Product specifications shown on the product page</p>
          </div>

          {/* Images */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Product Images</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
            {imagePreviews.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg border bg-gray-50">
                    <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
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
            <p className="mt-1 text-xs text-gray-400">Images are stored as data URLs. Max 2MB per image.</p>
          </div>

          {/* Rating */}
          <div className="rounded-lg border border-zinc-200 p-4">
            <label className="mb-3 block text-sm font-medium text-gray-700">Rating</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Average Rating (0–5)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.averageRating}
                    onChange={(e) => setFormData((prev) => ({ ...prev, averageRating: e.target.value }))}
                    placeholder="0"
                    className="w-24"
                  />
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, averageRating: String(star) }))}
                        className="text-gray-300 hover:text-yellow-400 transition-colors"
                      >
                        <Star
                          className="h-5 w-5"
                          fill={Number(formData.averageRating) >= star ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Review Count</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.reviewCount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reviewCount: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
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

          {/* SEO Section */}
          <div className="rounded-lg border border-zinc-200 p-4">
            <label className="mb-3 block text-sm font-medium text-gray-700">SEO (Auto-generated if left empty)</label>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Meta Title</label>
                <input
                  type="text"
                  value={seo.metaTitle}
                  onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                  placeholder="Auto: Product Name | Buy Online at WOX.11"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-400">{seo.metaTitle.length}/60</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Meta Description</label>
                <textarea
                  value={seo.metaDescription}
                  onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                  placeholder="Auto-generated from product description"
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-400">{seo.metaDescription.length}/160</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Keywords</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (keywordInput.trim() && !seo.keywords.includes(keywordInput.trim())) {
                          setSeo({ ...seo, keywords: [...seo.keywords, keywordInput.trim()] });
                          setKeywordInput("");
                        }
                      }
                    }}
                    placeholder="Add keyword..."
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                {seo.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {seo.keywords.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {kw}
                        <button type="button" onClick={() => setSeo({ ...seo, keywords: seo.keywords.filter((k) => k !== kw) })} className="text-gray-500 hover:text-red-500">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={seo.noindex}
                  onChange={(e) => setSeo({ ...seo, noindex: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-xs text-gray-500">Noindex (hide from search engines)</span>
              </div>
            </div>
          </div>

          {/* Tax Section */}
          <div className="rounded-lg border border-zinc-200 p-4">
            <label className="mb-3 block text-sm font-medium text-gray-700">Tax Configuration</label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">HSN Code</label>
                  <input
                    type="text"
                    value={taxData.hsnCode}
                    onChange={(e) => setTaxData({ ...taxData, hsnCode: e.target.value })}
                    placeholder="e.g. 6211"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">GST Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={taxData.gstRate}
                    onChange={(e) => setTaxData({ ...taxData, gstRate: Number(e.target.value) })}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Tax Category</label>
                  <select
                    value={taxData.taxCategory}
                    onChange={(e) => setTaxData({ ...taxData, taxCategory: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="apparel">Apparel</option>
                    <option value="electronics">Electronics</option>
                    <option value="food">Food</option>
                    <option value="services">Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={taxData.taxInclusive}
                      onChange={(e) => setTaxData({ ...taxData, taxInclusive: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-500">Price is tax inclusive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t pt-4">
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Product"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/wox/admin/products">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
