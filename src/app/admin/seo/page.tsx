"use client";

import { useState, useEffect } from "react";

type SeoSettings = {
  siteTitle: string;
  siteDescription: string;
  defaultOgImage: string;
  keywords: string[];
  homepageTitle: string;
  homepageDescription: string;
};

const defaultSettings: SeoSettings = {
  siteTitle: "WOX.11 | Modern Essentials for Men & Boys",
  siteDescription: "Premium men's and boys fashion store. Modern essentials for everyday wear. Shop shirts, t-shirts, and pants with free shipping in Kerala.",
  defaultOgImage: "/opengraph-image.png",
  keywords: ["men fashion", "boys fashion", "clothing", "shirts", "t-shirts", "pants", "online shopping"],
  homepageTitle: "WOX.11 — Modern Essentials for Men & Boys",
  homepageDescription: "Discover premium fashion for men and boys at WOX.11. Shop our curated collection of shirts, t-shirts, and pants.",
};

export default function AdminSeoPage() {
  const [settings, setSettings] = useState<SeoSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("wox-seo-settings");
    if (stored) {
      try { setSettings(JSON.parse(stored)); } catch {}
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem("wox-seo-settings", JSON.stringify(settings));
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !settings.keywords.includes(keywordInput.trim())) {
      setSettings({ ...settings, keywords: [...settings.keywords, keywordInput.trim()] });
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setSettings({ ...settings, keywords: settings.keywords.filter((k) => k !== kw) });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">SEO Settings</h1>

      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Global SEO</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site Title</label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{settings.siteTitle.length}/60 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{settings.siteDescription.length}/160 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Default OG Image URL</label>
              <input
                type="text"
                value={settings.defaultOgImage}
                onChange={(e) => setSettings({ ...settings, defaultOgImage: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
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
                onChange={(e) => setSettings({ ...settings, homepageTitle: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Homepage Description</label>
              <textarea
                value={settings.homepageDescription}
                onChange={(e) => setSettings({ ...settings, homepageDescription: e.target.value })}
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

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-zinc-900 text-white rounded text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
