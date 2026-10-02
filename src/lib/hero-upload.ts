import { MAX_HERO_DATA_URL_LENGTH } from "@/lib/hero-slides";

/**
 * Uploaded hero banners are stored inline (`data:image/...` — the app has no
 * file store), so the admin panel downscales and re-encodes the file in the
 * browser before saving. That keeps every upload well under the server limit
 * and keeps the public slides payload small.
 */

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const QUALITY_STEPS = [0.82, 0.7, 0.58];

export type HeroUploadResult =
  | { ok: true; dataUrl: string; width: number; height: number }
  | { ok: false; error: string };

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // fall through to the <img> path
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function compressHeroImage(file: File): Promise<HeroUploadResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Choose an image file (JPG, PNG, WebP, GIF)." };
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return { ok: false, error: "That file is larger than 15MB — use a smaller image." };
  }

  let decoded: DecodedImage;
  try {
    decoded = await decodeImage(file);
  } catch {
    return { ok: false, error: "Could not read that image file." };
  }

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { ok: false, error: "Canvas is unavailable in this browser." };
    }
    ctx.drawImage(decoded.source, 0, 0, width, height);

    for (const quality of QUALITY_STEPS) {
      let dataUrl = canvas.toDataURL("image/webp", quality);
      if (!dataUrl.startsWith("data:image/webp")) {
        // Safari versions without WebP encoding fall back to JPEG.
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      if (dataUrl.length <= MAX_HERO_DATA_URL_LENGTH) {
        return { ok: true, dataUrl, width, height };
      }
    }

    return {
      ok: false,
      error:
        "Could not compress this image under the storage limit — try a smaller or simpler image.",
    };
  } finally {
    decoded.release();
  }
}
