"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, X, ImagePlus, Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BackButton from "@/components/ui/back-button";
import { goBackOr } from "@/lib/back-navigation";
import PremiumSelect from "@/components/ui/premium-select";
import ImageUrlField from "@/components/admin/image-url-field";
import VariantCopyFields, {
  type VariantCopy,
} from "@/components/admin/variant-copy-fields";
import SpecEditor, { specValuesToRecord } from "@/components/product/spec-editor";
import type { SpecField, SpecTemplate } from "@/lib/specs/types";
import { supplierFetch } from "@/lib/supplier-api";

type Category = { _id: string; name: string; slug: string; gender: string; type: string };

interface SizeInput {
  name: string;
  quantity: number;
}

interface VariantImage {
  url: string;
  alt?: string;
  position?: number;
}

interface VariantInput {
  name: string;
  color: string;
  colorCode?: string;
  images: VariantImage[];
  /** Colour specific copy; empty strings mean "use the product level value". */
  title: string;
  description: string;
  specifications: { label: string; value: string }[];
  sizes: SizeInput[];
}

interface ProductImage {
  url: string;
  alt?: string;
  position?: number;
}

type LoadedProduct = {
  name?: string;
  description?: string;
  basePrice?: number;
  salePrice?: number | null;
  sku?: string;
  categoryId?: string | null;
  store?: string;
  storeId?: string;
  supplierId?: string;
  supplierName?: string;
  averageRating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  images?: ProductImage[];
  variants?: {
    name: string;
    color?: string;
    colorCode?: string;
    title?: string | null;
    description?: string | null;
    specifications?: { label: string; value: string }[] | null;
    images?: VariantImage[];
    sizes?: SizeInput[];
  }[];
  specifications?: { label: string; value: string }[];
  specValues?: { key: string; value: string }[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    noindex?: boolean;
  };
  tax?: {
    hsnCode?: string;
    gstRate?: number;
    taxCategory?: string;
    taxInclusive?: boolean;
  };
};

const defaultSizes: SizeInput[] = [
  { name: "S", quantity: 0 },
  { name: "M", quantity: 0 },
  { name: "L", quantity: 0 },
  { name: "XL", quantity: 0 },
  { name: "XXL", quantity: 0 },
];

const taxCategories = [
  { label: "Apparel", value: "apparel" },
  { label: "Electronics", value: "electronics" },
  { label: "Food", value: "food" },
  { label: "Services", value: "services" },
  { label: "Other", value: "other" },
];

/**
 * Supplier product form — a copy of the Admin "Add / Edit Product" page with
 * the same fields, sections, validation and controls. The only differences are
 * the endpoints it talks to and the ownership rules: the Store is always the
 * supplier's own store (read-only, assigned server side) and Featured stays an
 * admin-only decision.
 */
export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(!!productId);
  const [error, setError] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("");
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantInput[]>([
    { name: "Default", color: "", images: [], title: "", description: "", specifications: [], sizes: [...defaultSizes] },
  ]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    salePrice: "",
    sku: "",
    categoryId: "",
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
  const [specTemplates, setSpecTemplates] = useState<SpecTemplate[]>([]);
  const [specFields, setSpecFields] = useState<SpecField[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [activeTemplate, setActiveTemplate] = useState<SpecTemplate | null>(null);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    supplierFetch("/api/mongo/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {});
    // Same template source the admin form uses; the route already filters the
    // fields down to the ones suppliers are allowed to edit.
    supplierFetch("/api/spec-templates")
      .then((r) => r.json())
      .then((data) => setSpecTemplates(Array.isArray(data.templates) ? data.templates : []))
      .catch(() => {})
      .finally(() => setTemplatesLoaded(true));
  }, []);

  // The verified store name comes from the account, never from user input.
  useEffect(() => {
    supplierFetch("/api/wox/supplier/me")
      .then((r) => r.json())
      .then((data) => {
        const name = data?.store?.name || data?.supplier?.supplierName || "";
        if (name) setStoreName(name);
      })
      .catch(() => {});
  }, []);

  // The visible fields follow the selected category's type (Pants vs Shirts…).
  useEffect(() => {
    const category = categories.find((c) => c._id === formData.categoryId);
    if (!category) {
      setSpecFields([]);
      setActiveTemplate(null);
      return;
    }
    const template = specTemplates.find((t) => t.categoryType === category.type) ?? null;
    setActiveTemplate(template);
    setSpecFields(template?.fields ?? []);
  }, [formData.categoryId, categories, specTemplates]);

  useEffect(() => {
    if (!productId) return;
    supplierFetch(`/api/wox/supplier/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        const p: LoadedProduct | undefined = data.product;
        if (!p) {
          setError(data.error || "Product not found");
          setInitializing(false);
          return;
        }
        setFormData({
          name: p.name || "",
          description: p.description || "",
          basePrice: String(p.basePrice ?? ""),
          salePrice: p.salePrice ? String(p.salePrice) : "",
          sku: p.sku || "",
          categoryId: p.categoryId || "",
          averageRating: String(p.averageRating ?? 0),
          reviewCount: String(p.reviewCount ?? 0),
          isFeatured: p.isFeatured === true,
          isActive: p.isActive !== false,
        });
        if (p.store) setStoreName(p.store);
        setExistingImages(Array.isArray(p.images) ? p.images : []);
        if (p.seo && typeof p.seo === "object") {
          setSeo({
            metaTitle: p.seo.metaTitle || "",
            metaDescription: p.seo.metaDescription || "",
            keywords: Array.isArray(p.seo.keywords) ? p.seo.keywords : [],
            ogTitle: p.seo.ogTitle || "",
            ogDescription: p.seo.ogDescription || "",
            ogImage: p.seo.ogImage || "",
            noindex: !!p.seo.noindex,
          });
        }
        if (p.tax && typeof p.tax === "object") {
          setTaxData({
            hsnCode: p.tax.hsnCode ?? "6211",
            gstRate: Number(p.tax.gstRate ?? 5),
            taxCategory: p.tax.taxCategory ?? "apparel",
            taxInclusive: p.tax.taxInclusive !== false,
          });
        }
        if (Array.isArray(p.specifications)) {
          setSpecifications(
            p.specifications.filter((s) => s.label?.trim() && s.value?.trim())
          );
        }
        setSpecValues(specValuesToRecord(p.specValues));
        setVariants(
          Array.isArray(p.variants) && p.variants.length > 0
            ? p.variants.map((v) => ({
                name: v.name || "Default",
                color: v.color || "",
                colorCode: v.colorCode || "",
                title: v.title || "",
                description: v.description || "",
                specifications: Array.isArray(v.specifications) ? v.specifications : [],
                images: Array.isArray(v.images) ? v.images : [],
                sizes: Array.isArray(v.sizes) && v.sizes.length > 0 ? v.sizes : [...defaultSizes],
              }))
            : [{ name: "Default", color: "", images: [], title: "", description: "", specifications: [], sizes: [...defaultSizes] }]
        );
        setInitializing(false);
      })
      .catch(() => {
        setError("Failed to load product");
        setInitializing(false);
      });
  }, [productId]);

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
    e.target.value = "";
  }

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeImage(index: number) {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function addImageByUrl(url: string) {
    setImagePreviews((prev) => [...prev, url]);
  }

  function updateVariant(index: number, field: keyof VariantInput, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  function updateVariantSize(variantIdx: number, sizeIdx: number, field: keyof SizeInput, value: string | number) {
    setVariants((prev) => prev.map((v, i) => {
      if (i !== variantIdx) return v;
      return { ...v, sizes: v.sizes.map((s, j) => (j === sizeIdx ? { ...s, [field]: value } : s)) };
    }));
  }

  function addVariantImage(variantIdx: number, url: string) {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIdx ? { ...v, images: [...v.images, { url, position: v.images.length }] } : v
      )
    );
  }

  function removeVariantImage(variantIdx: number, imageIdx: number) {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIdx ? { ...v, images: v.images.filter((_, j) => j !== imageIdx) } : v
      )
    );
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      {
        name: `Variant ${prev.length + 1}`,
        color: "",
        images: [],
        title: "",
        description: "",
        specifications: [],
        sizes: [...defaultSizes],
      },
    ]);
  }

  function updateVariantCopy(variantIdx: number, copy: VariantCopy) {
    setVariants((prev) => prev.map((v, i) => (i === variantIdx ? { ...v, ...copy } : v)));
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const missingSpecs = specFields.filter(
      (field) => field.required && !String(specValues[field.key] ?? "").trim()
    );
    if (missingSpecs.length > 0) {
      setError(`Required specifications missing: ${missingSpecs.map((f) => f.label).join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const allImages = [
        ...existingImages.map((img, i) => ({ url: img.url, alt: img.alt || formData.name, position: i })),
        ...imagePreviews.map((url, i) => ({ url, alt: formData.name, position: existingImages.length + i })),
      ];
      const body = {
        name: formData.name,
        description: formData.description || undefined,
        basePrice: Number(formData.basePrice),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        sku: formData.sku,
        categoryId: formData.categoryId,
        averageRating: Number(formData.averageRating) || 0,
        reviewCount: Number(formData.reviewCount) || 0,
        isActive: formData.isActive,
        images: allImages,
        variants: variants.filter((v) => v.name).map((v) => ({
          name: v.name,
          color: v.color,
          colorCode: v.colorCode || "",
          title: v.title || "",
          description: v.description || "",
          specifications: v.specifications.filter((s) => s.label.trim() && s.value.trim()),
          images: v.images
            .filter((img) => img.url)
            .map((img, i) => ({ url: img.url, alt: img.alt || formData.name, position: i })),
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
        specValues,
      };

      const res = productId
        ? await supplierFetch(`/api/wox/supplier/products/${productId}`, {
            method: "PUT",
            body: JSON.stringify(body),
          })
        : await supplierFetch("/api/wox/supplier/products", {
            method: "POST",
            body: JSON.stringify(body),
          });

      const text = await res.text();
      let data: Record<string, unknown>;
      try { data = JSON.parse(text); } catch { data = { error: text }; }
      if (!res.ok) throw new Error(String(data.error || "Failed to save product"));

      router.push("/wox/supplier/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product. Check all fields and try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalStock = variants.reduce((sum, v) => sum + v.sizes.reduce((s, sz) => s + sz.quantity, 0), 0);

  if (initializing) {
    return <p className="py-12 text-center text-sm text-gray-400">Loading product...</p>;
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <BackButton href="/wox/supplier/products" variant="outline" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {productId ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-sm text-gray-500">
            {productId ? "Update product information" : "Create a new product listing"}
          </p>
        </div>
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
            <Input
              name="store"
              value={storeName}
              readOnly
              tabIndex={-1}
              placeholder="Loading your store…"
              className="cursor-not-allowed bg-zinc-50 text-zinc-700"
            />
            <p className="mt-1 text-xs text-gray-400">
              Assigned automatically from your verified supplier account — your products always
              belong to your own store.
            </p>
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
                    <label className="flex items-center gap-1.5 text-xs text-gray-500" title="Colour swatch">
                      <input
                        type="color"
                        value={variant.colorCode || "#000000"}
                        onChange={(e) => updateVariant(vi, "colorCode", e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
                      />
                      Swatch
                    </label>
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

                  {/* Photos for this colour */}
                  <div className="mt-3 border-t border-zinc-100 pt-3">
                    <p className="mb-2 text-xs font-medium text-gray-500">
                      Photos for this colour
                      <span className="ml-1 font-normal text-gray-400">
                        (optional — product gallery is used when empty)
                      </span>
                    </p>
                    {variant.images.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {variant.images.map((img, ii) => (
                          <div key={`${img.url}-${ii}`} className="group relative h-14 w-14 overflow-hidden rounded border bg-gray-50">
                            <img src={img.url} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeVariantImage(vi, ii)}
                              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <ImageUrlField
                      onAdd={(url) => addVariantImage(vi, url)}
                      existingUrls={variant.images.map((img) => img.url)}
                    />
                  </div>

                  {/* Colour specific copy */}
                  <VariantCopyFields
                    value={{
                      title: variant.title || "",
                      description: variant.description || "",
                      specifications: variant.specifications || [],
                    }}
                    onChange={(copy) => updateVariantCopy(vi, copy)}
                    productName={formData.name}
                  />
                </div>
              ))}
            </div>

            <p className="mt-2 text-xs text-gray-400">Total stock: {totalStock} units across all sizes</p>
          </div>

          {/* Specifications */}
          <div className="rounded-lg border border-zinc-200 p-4">
            <SpecEditor
              fields={specFields}
              values={specValues}
              onChange={setSpecValues}
              customRows={specifications}
              onCustomRowsChange={setSpecifications}
              canAddCustom={activeTemplate ? activeTemplate.allowSupplierCustom : true}
              loading={!templatesLoaded}
              emptyHint={
                formData.categoryId
                  ? "No specification fields are configured for this category yet."
                  : "Select a category to fill in its specification fields."
              }
            />
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

            <div className="mt-4 border-t border-zinc-100 pt-4">
              <ImageUrlField
                onAdd={addImageByUrl}
                existingUrls={[...existingImages.map((img) => img.url), ...imagePreviews]}
              />
            </div>
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
            <label className="flex items-center gap-2" title="Featured products are chosen by the admin">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                disabled
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Featured</span>
              <span className="text-xs text-gray-400">(set by admin)</span>
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
                  <PremiumSelect
                    value={taxData.taxCategory}
                    onValueChange={(val) => setTaxData((prev) => ({ ...prev, taxCategory: val }))}
                    options={taxCategories}
                    placeholder="Select tax category"
                  />
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
              {loading ? "Saving..." : productId ? "Update Product" : "Save Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => goBackOr(() => router.push("/wox/supplier/products"))}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
