"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Images,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { DEFAULT_HERO_SLIDES } from "@/lib/hero-slides";
import { compressHeroImage } from "@/lib/hero-upload";

const API = "/api/wox/admin/hero-slides";

type HeroSlide = {
  _id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  image: string;
  imageAlt: string;
  order: number;
  active: boolean;
};

const emptyForm = {
  title: "",
  subtitle: "",
  ctaLabel: "",
  ctaHref: "",
  secondaryCtaLabel: "",
  secondaryCtaHref: "",
  image: "",
  imageAlt: "",
  order: "0",
  active: true,
};

export default function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState("");
  const [previewBroken, setPreviewBroken] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  async function fetchSlides() {
    setLoadError("");
    try {
      const res = await adminFetch(API);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setSlides(Array.isArray(data.slides) ? data.slides : []);
    } catch {
      setLoadError("Could not load slides. Refresh the page to try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    if (name === "image") {
      setPreviewBroken(false);
      setUploadNote("");
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setPreviewBroken(false);
    setUploadNote("");
    try {
      const result = await compressHeroImage(file);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      setForm((prev) => ({ ...prev, image: result.dataUrl }));
      setUploadNote(
        `Ready: ${result.width}×${result.height}, ${Math.round(result.dataUrl.length / 1000)}KB`
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim() || !form.image.trim()) return;
    setSaving(true);
    try {
      const body = {
        ...(editingId ? { id: editingId } : {}),
        title: form.title,
        subtitle: form.subtitle,
        ctaLabel: form.ctaLabel,
        ctaHref: form.ctaHref,
        secondaryCtaLabel: form.secondaryCtaLabel,
        secondaryCtaHref: form.secondaryCtaHref,
        image: form.image,
        imageAlt: form.imageAlt,
        order: Number(form.order) || 0,
        active: form.active,
      };
      const res = await adminFetch(API, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to save slide");
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setUploadNote("");
      await fetchSlides();
    } catch {
      alert("Failed to save slide");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(slide: HeroSlide) {
    setEditingId(slide._id);
    setPreviewBroken(false);
    setUploadNote("");
    setForm({
      title: slide.title,
      subtitle: slide.subtitle || "",
      ctaLabel: slide.ctaLabel || "",
      ctaHref: slide.ctaHref || "",
      secondaryCtaLabel: slide.secondaryCtaLabel || "",
      secondaryCtaHref: slide.secondaryCtaHref || "",
      image: slide.image,
      imageAlt: slide.imageAlt || "",
      order: String(slide.order ?? 0),
      active: slide.active !== false,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Full slide payload for PUT — the endpoint always validates everything. */
  function slideBody(slide: HeroSlide, overrides: Record<string, unknown> = {}) {
    return {
      id: slide._id,
      title: slide.title,
      subtitle: slide.subtitle,
      ctaLabel: slide.ctaLabel,
      ctaHref: slide.ctaHref,
      secondaryCtaLabel: slide.secondaryCtaLabel,
      secondaryCtaHref: slide.secondaryCtaHref,
      image: slide.image,
      imageAlt: slide.imageAlt,
      order: slide.order,
      active: slide.active,
      ...overrides,
    };
  }

  async function putSlide(body: Record<string, unknown>): Promise<boolean> {
    const res = await adminFetch(API, { method: "PUT", body: JSON.stringify(body) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to update slide");
      return false;
    }
    return true;
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this slide?")) return;
    setBusyId(id);
    try {
      const res = await adminFetch(`${API}?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete slide");
        return;
      }
      await fetchSlides();
    } catch {
      alert("Failed to delete slide");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(slide: HeroSlide) {
    setBusyId(slide._id);
    try {
      const ok = await putSlide(slideBody(slide, { active: !slide.active }));
      if (ok) await fetchSlides();
    } catch {
      alert("Failed to update slide");
    } finally {
      setBusyId(null);
    }
  }

  /** Swap with the neighbour and rewrite positions so the list order sticks. */
  async function moveSlide(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const ordered = [...slides];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setBusyId(slides[index]._id);
    try {
      for (let position = 0; position < ordered.length; position++) {
        const slide = ordered[position];
        if (slide.order === position) continue;
        const ok = await putSlide(slideBody(slide, { order: position }));
        if (!ok) return;
      }
      await fetchSlides();
    } catch {
      alert("Failed to reorder slides");
    } finally {
      setBusyId(null);
    }
  }

  /** Adopt the built-in hero as a real, editable slide (nothing stays hardcoded). */
  async function importDefaultHero() {
    const d = DEFAULT_HERO_SLIDES[0];
    if (!d) return;
    setImporting(true);
    try {
      const res = await adminFetch(API, {
        method: "POST",
        body: JSON.stringify({
          title: d.title,
          subtitle: d.subtitle,
          ctaLabel: d.ctaLabel,
          ctaHref: d.ctaHref,
          secondaryCtaLabel: d.secondaryCtaLabel,
          secondaryCtaHref: d.secondaryCtaHref,
          image: d.image,
          imageAlt: d.imageAlt,
          order: 0,
          active: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to import the default hero");
        return;
      }
      await fetchSlides();
    } catch {
      alert("Failed to import the default hero");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero Slides</h1>
          <p className="text-sm text-gray-500">
            Slides rotate automatically on the homepage banner. Saved changes show
            there on the next page load.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({ ...emptyForm, order: String(slides.length) });
            setEditingId(null);
            setPreviewBroken(false);
            setUploadNote("");
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> New Slide
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border bg-gray-50 p-4">
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? "Edit Slide" : "New Slide"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Headline</label>
              <Input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Define Your Everyday."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Subheading</label>
              <Input
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                placeholder="e.g. Modern essentials for men and boys."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Primary CTA Label</label>
              <Input
                name="ctaLabel"
                value={form.ctaLabel}
                onChange={handleChange}
                placeholder="e.g. Shop Men"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Primary CTA Link</label>
              <Input
                name="ctaHref"
                value={form.ctaHref}
                onChange={handleChange}
                placeholder="/men"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Secondary CTA Label</label>
              <Input
                name="secondaryCtaLabel"
                value={form.secondaryCtaLabel}
                onChange={handleChange}
                placeholder="e.g. Shop Boys"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Secondary CTA Link</label>
              <Input
                name="secondaryCtaHref"
                value={form.secondaryCtaHref}
                onChange={handleChange}
                placeholder="/boys"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Image</label>
              <div className="flex gap-2">
                <Input
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="/images/hero.jpg or https://example.com/banner.jpg"
                  className="flex-1"
                />
                <label
                  className={cn(
                    "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-950 has-[:focus-visible]:ring-offset-2",
                    uploading && "pointer-events-none opacity-60"
                  )}
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Compressing…" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Paste a local path (/images/...) or an image link, or upload a file —
                uploads are resized and compressed before saving.
              </p>
              {uploadNote && <p className="mt-1 text-xs text-green-600">{uploadNote}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Image Alt Text</label>
              <Input
                name="imageAlt"
                value={form.imageAlt}
                onChange={handleChange}
                placeholder="Describes the image for screen readers"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Order (lower first)</label>
              <Input
                name="order"
                type="number"
                value={form.order}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
              className="h-4 w-4"
            />
            Visible on the homepage
          </label>

          {form.image.trim() && (
            <div className="mt-4 h-40 overflow-hidden rounded-lg border bg-zinc-100">
              {previewBroken ? (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-500">
                  Preview unavailable — check the image path or link.
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt="Slide preview"
                  className="h-full w-full object-cover"
                  onError={() => setPreviewBroken(true)}
                />
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.image.trim()}
            >
              <Check className="mr-2 h-4 w-4" /> {editingId ? "Update" : "Create"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : loadError ? (
        <div className="py-8 text-center text-sm text-red-500">{loadError}</div>
      ) : slides.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <Images className="mx-auto mb-4 h-12 w-12" />
          <p>No slides yet</p>
          <p className="mt-1 text-sm">
            The homepage falls back to the default hero until a slide is added.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={importDefaultHero}
            disabled={importing}
          >
            {importing ? "Importing…" : "Start from the default hero"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <div
              key={slide._id}
              className="flex flex-wrap items-center gap-4 rounded-lg border bg-white p-3 shadow-sm"
            >
              <div className="h-16 w-28 shrink-0 overflow-hidden rounded border bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image}
                  alt={slide.imageAlt || slide.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{slide.title}</p>
                <p className="truncate text-xs text-gray-500">
                  {slide.subtitle || "No subheading"} · Position {index + 1} of {slides.length}
                </p>
              </div>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-medium",
                  slide.active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {slide.active ? "Visible" : "Hidden"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveSlide(index, -1)}
                  disabled={index === 0 || busyId !== null}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Move ${slide.title} up`}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSlide(index, 1)}
                  disabled={index === slides.length - 1 || busyId !== null}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Move ${slide.title} down`}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(slide)}
                  disabled={busyId !== null}
                  className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                >
                  {slide.active ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(slide)}
                  disabled={busyId !== null}
                  className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
                  aria-label={`Edit ${slide.title}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(slide._id)}
                  disabled={busyId !== null}
                  className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-40"
                  aria-label={`Delete ${slide.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
