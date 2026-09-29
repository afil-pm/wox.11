"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BackButton from "@/components/ui/back-button";
import { goBackOr } from "@/lib/back-navigation";
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

interface VariantInput {
  name: string;
  color: string;
  colorCode?: string;
  /** Photos specific to this colour; empty means "use the main gallery". */
  images: ProductImage[];
  /** Colour specific copy; empty means "use the product level value". */
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

const defaultSizes: SizeInput[] = [
  { name: "S", quantity: 0 },
  { name: "M", quantity: 0 },
  { name: "L", quantity: 0 },
  { name: "XL", quantity: 0 },
  { name: "XXL", quantity: 0 },
];

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(!!productId);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
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
    isActive: true,
  });
  const [specifications, setSpecifications] = useState<{ label: string; value: string }[]>([]);
  const [specTemplates, setSpecTemplates] = useState<SpecTemplate[]>([]);
  const [specFields, setSpecFields] = useState<SpecField[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [activeTemplate, setActiveTemplate] = useState<SpecTemplate | null>(null);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  useEffect(() => {
    supplierFetch("/api/mongo/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {});
    supplierFetch("/api/spec-templates")
      .then((r) => r.json())
      .then((data) => setSpecTemplates(Array.isArray(data.templates) ? data.templates : []))
      .catch(() => {})
      .finally(() => setTemplatesLoaded(true));
  }, []);

  // Show only the fields the admin configured for the selected category type.
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
        const p = data.product;
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
          isActive: p.isActive !== false,
        });
        setImages(
          Array.isArray(p.images)
            ? p.images.map((img: { url: string; alt?: string; position?: number }) => ({
                url: img.url,
                alt: img.alt,
                position: img.position,
              }))
            : []
        );
        if (Array.isArray(p.specifications)) {
          setSpecifications(
            p.specifications.filter(
              (s: { label?: string; value?: string }) => s.label?.trim() && s.value?.trim()
            )
          );
        }
        setSpecValues(specValuesToRecord(p.specValues));
        setVariants(
          Array.isArray(p.variants) && p.variants.length > 0
            ? p.variants.map(
                (v: {
                  name: string;
                  color?: string;
                  colorCode?: string;
                  images?: ProductImage[];
                  title?: string;
                  description?: string;
                  specifications?: { label: string; value: string }[];
                  sizes?: SizeInput[];
                }) => ({
                  name: v.name || "Default",
                  color: v.color || "",
                  colorCode: v.colorCode || "",
                  title: v.title || "",
                  description: v.description || "",
                  specifications: Array.isArray(v.specifications) ? v.specifications : [],
                  images: Array.isArray(v.images)
                    ? v.images.map((img) => ({ url: img.url, alt: img.alt, position: img.position }))
                    : [],
                  sizes: Array.isArray(v.sizes) ? v.sizes : [...defaultSizes],
                })
              )
            : [{ name: "Default", color: "", images: [], title: "", description: "", specifications: [], sizes: [...defaultSizes] }]
        );
        setInitializing(false);
      })
      .catch(() => {
        setError("Failed to load product");
        setInitializing(false);
      });
  }, [productId]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function addImage(url: string) {
    setImages((prev) => [...prev, { url, position: prev.length }]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof VariantInput, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  function updateSize(variantIdx: number, sizeIdx: number, field: keyof SizeInput, value: string | number) {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== variantIdx) return v;
        return { ...v, sizes: v.sizes.map((s, j) => (j === sizeIdx ? { ...s, [field]: value } : s)) };
      })
    );
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
      const body = {
        name: formData.name,
        description: formData.description,
        basePrice: Number(formData.basePrice),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        sku: formData.sku,
        categoryId: formData.categoryId,
        isActive: formData.isActive,
        specifications: specifications.filter((s) => s.label.trim() && s.value.trim()),
        specValues,
        images: images.map((img, i) => ({ url: img.url, alt: img.alt || formData.name, position: i })),
        variants: variants
          .filter((v) => v.name)
          .map((v) => ({
            name: v.name,
            color: v.color,
            colorCode: v.colorCode || "",
            title: v.title || "",
            description: v.description || "",
            specifications: v.specifications.filter((s) => s.label.trim() && s.value.trim()),
            images: v.images
              .filter((img) => img.url)
              .map((img, i) => ({ url: img.url, alt: img.alt || "", position: i })),
            sizes: v.sizes.filter((s) => s.name).map((s) => ({ name: s.name, quantity: s.quantity || 0 })),
          })),
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to save product");
        return;
      }

      router.push("/wox/supplier/products");
      router.refresh();
    } catch {
      setError("Failed to save product");
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return <p className="text-sm text-zinc-500">Loading product...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <BackButton href="/wox/supplier/products" variant="outline" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {productId ? "Edit Product" : "Add Product"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            This product will be listed on the store under your supplier name.
          </p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Product Name</label>
              <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                placeholder="Fabric, fit, care instructions..."
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Category</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">SKU</label>
                <Input name="sku" value={formData.sku} onChange={handleChange} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Base Price (₹)
                </label>
                <Input
                  name="basePrice"
                  type="number"
                  min={1}
                  value={formData.basePrice}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Sale Price (₹, optional)
                </label>
                <Input
                  name="salePrice"
                  type="number"
                  min={0}
                  value={formData.salePrice}
                  onChange={handleChange}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Active (visible in the store)
            </label>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Images</h2>
          <div className="space-y-3">
            {images.map((img, i) => (
              <div key={`${img.url}-${i}`} className="flex items-center gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-zinc-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="flex-1 truncate text-xs text-zinc-500">{img.url}</p>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <ImageUrlField onAdd={addImage} existingUrls={images.map((img) => img.url)} />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Variants & Stock</h2>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Variant
            </Button>
          </div>

          <div className="space-y-5">
            {variants.map((variant, vi) => (
              <div key={vi} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <input
                    value={variant.name}
                    onChange={(e) => updateVariant(vi, "name", e.target.value)}
                    placeholder="Variant name"
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  />
                  <input
                    value={variant.color}
                    onChange={(e) => updateVariant(vi, "color", e.target.value)}
                    placeholder="Color"
                    className="w-36 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  />
                  <label
                    className="flex items-center gap-2 text-xs text-zinc-500"
                    title="Colour swatch"
                  >
                    <input
                      type="color"
                      value={variant.colorCode || "#000000"}
                      onChange={(e) => updateVariant(vi, "colorCode", e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
                    />
                    Swatch
                  </label>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(vi)}
                      className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {variant.sizes.map((size, si) => (
                    <div key={`${size.name}-${si}`}>
                      <label className="mb-1 block text-xs font-medium text-zinc-500">
                        {size.name || `Size ${si + 1}`}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={size.quantity}
                        onChange={(e) => updateSize(vi, si, "quantity", Number(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-900"
                      />
                    </div>
                  ))}
                </div>

                {/* Photos for this colour (falls back to the main gallery) */}
                <div className="mt-4 border-t border-zinc-100 pt-3">
                  <p className="mb-2 text-xs font-medium text-zinc-500">
                    Photos for this colour
                    <span className="ml-1 font-normal text-zinc-400">
                      (optional — product gallery is used when empty)
                    </span>
                  </p>
                  <div className="space-y-2">
                    {variant.images.map((img, ii) => (
                      <div key={`${img.url}-${ii}`} className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded border bg-zinc-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt="" className="h-full w-full object-cover" />
                        </div>
                        <p className="flex-1 truncate text-xs text-zinc-500">{img.url}</p>
                        <button
                          type="button"
                          onClick={() => removeVariantImage(vi, ii)}
                          className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <ImageUrlField
                      onAdd={(url) => addVariantImage(vi, url)}
                      existingUrls={variant.images.map((img) => img.url)}
                    />
                  </div>
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
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
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

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="bg-zinc-900 text-white hover:bg-zinc-800">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" /> {productId ? "Save Changes" : "Create Product"}
              </span>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => goBackOr(() => router.push("/wox/supplier/products"))}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
