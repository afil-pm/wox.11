"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  checkImageUrlLoads,
  isExternalImageUrl,
  validateProductImageUrl,
} from "@/lib/images";

interface ImageUrlFieldProps {
  onAdd: (url: string) => void;
  existingUrls?: string[];
}

const AUTO_CHECK_DELAY = 500;

export default function ImageUrlField({ onAdd, existingUrls = [] }: ImageUrlFieldProps) {
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkIdRef = useRef(0);
  const existingUrlsRef = useRef<string[]>(existingUrls);

  useEffect(() => {
    existingUrlsRef.current = existingUrls;
  }, [existingUrls]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function runCheck(raw: string, reportFormatErrors: boolean) {
    const url = raw.trim();
    const checkId = ++checkIdRef.current;

    setPreview(null);
    setError(null);
    setChecking(false);
    if (!url) return;

    if (!isExternalImageUrl(url)) {
      if (reportFormatErrors) {
        setError("Enter a full image URL starting with http:// or https://");
      }
      return;
    }

    const validation = validateProductImageUrl(url);
    if (!validation.ok) {
      if (reportFormatErrors) setError(validation.error);
      return;
    }

    if (existingUrlsRef.current.includes(validation.url)) {
      setError("This image has already been added.");
      return;
    }

    setChecking(true);
    try {
      await checkImageUrlLoads(validation.url);
      if (checkIdRef.current === checkId) setPreview(validation.url);
    } catch (err) {
      if (checkIdRef.current === checkId) {
        setError(err instanceof Error ? err.message : "Image could not be loaded from this URL.");
      }
    } finally {
      if (checkIdRef.current === checkId) setChecking(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    ++checkIdRef.current;
    setValue(next);
    setPreview(null);
    setError(null);
    setChecking(false);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (!next.trim()) return;

    timerRef.current = setTimeout(() => {
      runCheck(next, false);
    }, AUTO_CHECK_DELAY);
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim() || preview || checking) return;
    runCheck(value, true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (preview) {
      handleAdd();
    } else {
      runCheck(value, true);
    }
  }

  function handleAdd() {
    if (!preview) return;
    onAdd(preview);
    setValue("");
    setPreview(null);
    setError(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    inputRef.current?.focus();
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="url"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/product-image.jpg"
        />
        {preview ? (
          <Button type="button" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Image
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              runCheck(value, true);
            }}
            disabled={checking || !value.trim()}
          >
            {checking ? "Checking..." : "Preview"}
          </Button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {preview && (
        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
            <img src={preview} alt="Image URL preview" className="h-full w-full object-cover" />
          </div>
          <p className="text-xs text-gray-500">
            Image loaded successfully. Click <span className="font-medium text-gray-700">Add Image</span> to attach it
            to this product.
          </p>
        </div>
      )}

      {!preview && !error && !checking && (
        <p className="mt-1 text-xs text-gray-400">
          Paste a direct link to an image hosted anywhere (https://...). The image stays on its original host.
        </p>
      )}
    </div>
  );
}
