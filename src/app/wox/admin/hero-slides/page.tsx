"use client";

import { useEffect, useState } from "react";
import { Check, Images, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  async function fetchSlides() {
    try {
      const res = await adminFetch("/api/wox/admin/hero-slides");
      const data = await res.json();
      setSlides(Array.isArray(data.slides) ? data.slides : []);
    } catch {
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
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
      const res = await adminFetch("/api/wox/admin/hero-slides", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to save slide");
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchSlides();
    } catch {
      alert("Failed to save slide");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(slide: HeroSlide) {
    setEditingId(slide._id);
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this slide?")) return;
    try {
      await adminFetch(`/api/wox/admin/hero-slides?id=${id}`, { method: "DELETE" });
      fetchSlides();
    } catch {
      // silent
    }
  }

  async function toggleActive(slide: HeroSlide) {
    try {
      await adminFetch("/api/wox/admin/hero-slides", {
        method: "PUT",
        body: JSON.stringify({
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
          active: !slide.active,
        }),
      });
      fetchSlides();
    } catch {
      // silent
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero Slides</h1>
          <p className="text-sm text-gray-500">
            Slides rotate automatically on the homepage banner.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
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
              <label className="mb-1 block text-sm font-medium">Image URL</label>
              <Input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="/images/hero.jpg or https://example.com/banner.jpg"
              />
              <p className="mt-1 text-xs text-gray-400">
                A local asset (/images/...) or a direct link to an image.
              </p>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.image}
                alt="Slide preview"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button onClick={handleSave} disabled={saving || !form.title || !form.image}>
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
      ) : slides.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <Images className="mx-auto mb-4 h-12 w-12" />
          <p>No slides yet</p>
          <p className="mt-1 text-sm">
            The homepage falls back to the default hero until a slide is added.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => (
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
                  {slide.subtitle || "No subheading"} · Order {slide.order}
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
                  onClick={() => toggleActive(slide)}
                  className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                >
                  {slide.active ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(slide)}
                  className="rounded p-1 hover:bg-gray-100"
                  aria-label={`Edit ${slide.title}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(slide._id)}
                  className="rounded p-1 text-red-500 hover:bg-red-50"
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
