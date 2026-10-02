"use client";

import { useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { checkImageUrlLoads } from "@/lib/images";
import { compressHeroImage } from "@/lib/hero-upload";
import {
  DEFAULT_SEO_SETTINGS,
  validateOgImageUrl,
  type SeoSettingsData,
} from "@/lib/seo-settings";

const API = "/api/wox/admin/seo";
const LOCAL_KEY = "wox-seo-settings";
const DEFAULT_OG_PREVIEW = "/opengraph-image.png";

export default function AdminSeoPage() {
  const [settings, setSettings] = useState<SeoSettingsData>(DEFAULT_SEO_SETTINGS);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [urlChecking, setUrlChecking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadNote, setUploadNote] = useState("");
  const [previewBroken, setPreviewBroken] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const urlAutoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // Whenever the chosen image changes (upload, URL apply, remove, reload),
  // retry the preview instead of keeping a stale "could not be loaded" state.
  useEffect(() => {
    setPreviewBroken(false);
  }, [settings.defaultOgImage]);

  useEffect(() => {
    return () => {
      if (urlAutoTimer.current) clearTimeout(urlAutoTimer.current);
    };
  }, []);

  async function loadSettings() {
    setLoadError("");
    try {
      const res = await adminFetch(API);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      if (data.exists) {
        setSettings({ ...DEFAULT_SEO_SETTINGS, ...data.settings });
        setExists(true);
      } else {
        // First run (or settings never saved): seed from the localStorage copy
        // the old panel used so previously entered values aren't lost.
        let seeded = DEFAULT_SEO_SETTINGS;
        const stored = localStorage.getItem(LOCAL_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") {
              seeded = { ...DEFAULT_SEO_SETTINGS, ...parsed };
            }
          } catch {}
        }
        setSettings(seeded);
        setExists(false);
      }
    } catch {
      setLoadError("Could not load SEO settings. Refresh the page to try again.");
    } finally {
      setLoading(false);
    }
  }

  const update = (patch: Partial<SeoSettingsData>) => setSettings((prev) => ({ ...prev, ...patch }));

  const isUploaded =
    settings.defaultOgImage.startsWith("data:") ||
    settings.defaultOgImage.startsWith("/api/og-image");
  const customLink = settings.defaultOgImage && !isUploaded ? settings.defaultOgImage : "";
  const previewSrc = settings.defaultOgImage || DEFAULT_OG_PREVIEW;
  const previewLabel = !settings.defaultOgImage
    ? "Site default"
    : isUploaded
      ? "Uploaded image"
      : "Custom URL";

  function handlePreviewLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    setPreviewBroken(false);
    const img = e.currentTarget;
    if (!settings.defaultOgImage) return;
    const width = img.naturalWidth || 0;
    const height = img.naturalHeight || 0;
    if (width !== settings.ogImageWidth || height !== settings.ogImageHeight) {
      update({ ogImageWidth: width, ogImageHeight: height });
    }
  }

  async function applyUrl(raw: string, silent: boolean) {
    if (!raw) return;
    const check = validateOgImageUrl(raw);
    if (!check.ok) {
      if (!silent) setUrlError(check.error);
      return;
    }
    if (check.kind === "upload") {
      if (!silent) {
        setUrlError("That looks like an uploaded file — use the Upload image button instead.");
      }
      return;
    }
    if (check.kind === "default") return;
    if (check.url === settings.defaultOgImage) return;

    if (!silent) {
      setUrlError("");
      setUrlChecking(true);
    }
    try {
      await checkImageUrlLoads(check.url);
      update({ defaultOgImage: check.url, ogImageWidth: 0, ogImageHeight: 0 });
      if (!silent) setUrlInput("");
      setUrlError("");
      setUploadNote("");
    } catch (err) {
      // Silent (auto) probes stay quiet — the explicit Apply URL path reports.
      if (!silent) {
        setUrlError(err instanceof Error ? err.message : "Image could not be loaded from this URL.");
      }
    } finally {
      if (!silent) setUrlChecking(false);
    }
  }

  function handleApplyUrl() {
    if (urlAutoTimer.current) clearTimeout(urlAutoTimer.current);
    void applyUrl(urlInput.trim(), false);
  }

  /**
   * Typing a URL also updates the preview (after a short pause) so the admin
   * sees the image before pressing Apply URL. Values that fail validation or
   * cannot load are ignored silently until applied explicitly.
   */
  function scheduleUrlPreview(value: string) {
    if (urlAutoTimer.current) clearTimeout(urlAutoTimer.current);
    const raw = value.trim();
    if (!raw || raw === settings.defaultOgImage) return;
    urlAutoTimer.current = setTimeout(() => {
      urlAutoTimer.current = null;
      void applyUrl(raw, true);
    }, 800);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (urlAutoTimer.current) clearTimeout(urlAutoTimer.current);
    setUploading(true);
    setUploadError("");
    try {
      const result = await compressHeroImage(file);
      if (!result.ok) {
        setUploadError(result.error);
        return;
      }
      update({
        defaultOgImage: result.dataUrl,
        ogImageWidth: result.width,
        ogImageHeight: result.height,
      });
      setUploadNote(
        `Ready: ${result.width}×${result.height}, ${Math.round(result.dataUrl.length / 1000)}KB`
      );
      setUrlInput("");
      setUrlError("");
      setPreviewBroken(false);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    if (urlAutoTimer.current) clearTimeout(urlAutoTimer.current);
    update({ defaultOgImage: "", ogImageWidth: 0, ogImageHeight: 0, ogImageAlt: "" });
    setUrlInput("");
    setUrlError("");
    setUploadError("");
    setUploadNote("");
    setPreviewBroken(false);
  }

  const handleSave = async () => {
    if (urlAutoTimer.current) clearTimeout(urlAutoTimer.current);
    setSaving(true);
    setSaveError("");
    try {
      const res = await adminFetch(API, {
        method: "PUT",
        body: JSON.stringify({
          ...settings,
          ogImage: settings.defaultOgImage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || "Failed to save SEO settings");
        return;
      }
      const next: SeoSettingsData = { ...DEFAULT_SEO_SETTINGS, ...data.settings };
      setSettings(next);
      setExists(true);
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      } catch {}
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("Failed to save SEO settings");
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !settings.keywords.includes(keywordInput.trim())) {
      update({ keywords: [...settings.keywords, keywordInput.trim()] });
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    update({ keywords: settings.keywords.filter((k) => k !== kw) });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">SEO Settings</h1>

      {loadError && <p className="mb-4 text-sm text-red-600">{loadError}</p>}

      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Global SEO</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site Title</label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={(e) => update({ siteTitle: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{settings.siteTitle.length}/60 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => update({ siteDescription: e.target.value })}
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{settings.siteDescription.length}/160 characters</p>
            </div>

            <div className="rounded-lg border bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Open Graph Image</h3>
                <span className="text-xs px-2 py-1 bg-white border rounded text-gray-600">
                  {previewLabel}
                </span>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="w-full sm:w-72 shrink-0">
                  <div className="relative overflow-hidden rounded-lg border bg-white">
                    {previewBroken ? (
                      <div className="flex h-40 items-center justify-center px-3 text-center text-xs text-gray-500">
                        Preview could not be loaded. Check that the image is publicly accessible.
                      </div>
                    ) : (
                      <img
                        src={previewSrc}
                        alt="Open Graph image preview"
                        onLoad={handlePreviewLoad}
                        onError={() => setPreviewBroken(true)}
                        className="h-40 w-full object-contain"
                      />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {settings.ogImageWidth > 0 && settings.ogImageHeight > 0
                      ? `${settings.ogImageWidth}×${settings.ogImageHeight}`
                      : "Recommended 1200×630 or larger"}
                  </p>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => {
                          setUrlInput(e.target.value);
                          setUrlError("");
                          scheduleUrlPreview(e.target.value);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyUrl())}
                        placeholder={
                          customLink
                            ? `Current: ${customLink}`
                            : isUploaded
                              ? "Uploaded image — enter a URL to replace it"
                              : "https://example.com/og.jpg or /images/og.jpg"
                        }
                        className="flex-1 border rounded px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        disabled={urlChecking || !urlInput.trim()}
                        className="px-4 py-2 bg-gray-100 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                      >
                        {urlChecking ? "Checking..." : "Apply URL"}
                      </button>
                    </div>
                    <div className="mt-1 flex gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {uploading ? "Compressing..." : "Upload image"}
                      </button>
                      {settings.defaultOgImage && (
                        <button
                          type="button"
                          onClick={handleRemove}
                          className="text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {urlError && <p className="mt-1 text-xs text-red-600">{urlError}</p>}
                    {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
                    {uploadNote && <p className="mt-1 text-xs text-green-700">{uploadNote}</p>}
                    {!urlError && !uploadError && !uploadNote && (
                      <p className="mt-1 text-xs text-gray-400">
                        JPG, PNG or WebP — paste a public URL or upload a file (compressed automatically).
                        Applied changes are published when you save.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Image alt text</label>
                    <input
                      type="text"
                      value={settings.ogImageAlt}
                      onChange={(e) => update({ ogImageAlt: e.target.value })}
                      placeholder="Describes the image for link previews"
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Keywords</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                  placeholder="Add keyword..."
                  className="flex-1 border rounded px-3 py-2 text-sm"
                />
                <button onClick={addKeyword} className="px-4 py-2 bg-gray-100 rounded text-sm hover:bg-gray-200">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.keywords.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="text-gray-500 hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Homepage SEO</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Homepage Title</label>
              <input
                type="text"
                value={settings.homepageTitle}
                onChange={(e) => update({ homepageTitle: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Homepage Description</label>
              <textarea
                value={settings.homepageDescription}
                onChange={(e) => update({ homepageDescription: e.target.value })}
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-3">SEO Preview</h2>
          <div className="bg-gray-50 rounded p-4">
            <p className="text-blue-700 text-lg font-medium truncate">{settings.siteTitle}</p>
            <p className="text-green-700 text-sm">https://wox11.vercel.app</p>
            <p className="text-gray-600 text-sm mt-1">{settings.siteDescription}</p>
          </div>
        </div>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-2 bg-zinc-900 text-white rounded text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
          {exists && (
            <span className="self-center text-xs text-gray-500">Saved in the database — live on the next page load.</span>
          )}
        </div>
      </div>
    </div>
  );
}
