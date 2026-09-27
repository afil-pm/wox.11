export const MAX_IMAGE_URL_LENGTH = 2048;

export type ImageUrlValidation =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * True when the src is a remote http(s) URL hosted outside the app
 * (i.e. an externally hosted product image rather than an uploaded data URL
 * or a local asset).
 */
export function isExternalImageUrl(src?: string | null): boolean {
  if (!src) return false;
  return /^https?:\/\//i.test(src.trim());
}

/**
 * Validates a product image URL before it is saved.
 *
 * Accepts everything the app can legitimately render:
 * - uploaded images (data:image/...)
 * - local assets (/images/...)
 * - external http(s) image URLs
 */
export function validateProductImageUrl(raw?: string | null): ImageUrlValidation {
  const url = (raw ?? "").trim();

  if (!url) {
    return { ok: false, error: "Image URL is required" };
  }

  if (url.length > MAX_IMAGE_URL_LENGTH) {
    return {
      ok: false,
      error: `Image URL must be ${MAX_IMAGE_URL_LENGTH} characters or fewer`,
    };
  }

  if (url.startsWith("data:")) {
    return /^data:image\//i.test(url)
      ? { ok: true, url }
      : { ok: false, error: "Data URL must contain an image (data:image/...)" };
  }

  if (url.startsWith("/") && !url.startsWith("//")) {
    return { ok: true, url };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      ok: false,
      error: "Enter a full image URL, e.g. https://example.com/image.jpg",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http:// and https:// image URLs are supported" };
  }

  return { ok: true, url: parsed.toString() };
}

/**
 * Tries to load the image in the browser so the admin gets an error before
 * saving when the URL is unreachable or does not point to an image.
 */
export function checkImageUrlLoads(url: string, timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof Image === "undefined") {
      reject(new Error("Image could not be checked in this environment"));
      return;
    }

    const img = new Image();
    const timer = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      img.src = "";
      reject(new Error("Image took too long to load. Check the URL and try again."));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve();
    };

    img.onerror = () => {
      clearTimeout(timer);
      reject(
        new Error(
          "Image could not be loaded from this URL. Check that the link points directly to an image and is publicly accessible."
        )
      );
    };

    img.src = url;
  });
}
