/**
 * Colour detection for the Quick Choose flow: reads the dominant colour out of
 * an uploaded product image and names it the way a person would
 * (Black, White, Navy Blue, Olive Green…).
 *
 * Everything that touches the DOM lives behind `detectImageColors`; the pixel
 * maths (`dominantColorFromImageData`) and the naming (`colorNameFromHex`) are
 * pure so they can be unit tested outside the browser too.
 */

export type DetectedColor = {
  hex: string;
  name: string;
  /** 1-based position of the image the colour came from. */
  index: number;
  sourceUrl: string;
};

/** Human names for the colours that actually show up in fashion catalogues. */
const NAMED_COLORS: ReadonlyArray<readonly [name: string, hex: string]> = [
  ["Black", "#1a1a1a"],
  ["Charcoal Gray", "#36454f"],
  ["Dark Gray", "#4b4b4b"],
  ["Gray", "#808080"],
  ["Light Gray", "#c9cbcd"],
  ["White", "#ffffff"],
  ["Off White", "#efe9dc"],
  ["Cream", "#f3e7c8"],
  ["Beige", "#e3d3b6"],
  ["Tan", "#d2b48c"],
  ["Khaki", "#bfae8a"],
  ["Brown", "#6b4423"],
  ["Chocolate", "#7b3f00"],
  ["Maroon", "#6d1a1a"],
  ["Burgundy", "#722f37"],
  ["Red", "#c0392b"],
  ["Coral", "#ff7f50"],
  ["Orange", "#e07b00"],
  ["Mustard", "#d1a116"],
  ["Yellow", "#f2c94c"],
  ["Olive Green", "#708238"],
  ["Dark Green", "#2f5d3a"],
  ["Green", "#3a9d5d"],
  ["Mint Green", "#9ff2c5"],
  ["Lime Green", "#a9d13a"],
  ["Teal", "#157f7f"],
  ["Turquoise", "#30d5c8"],
  ["Sky Blue", "#7fb7e8"],
  ["Light Blue", "#a8cbee"],
  ["Blue", "#2f6fd0"],
  ["Navy Blue", "#1b2a4a"],
  ["Royal Blue", "#4169e1"],
  ["Purple", "#6a3d9a"],
  ["Violet", "#8b5cf6"],
  ["Lavender", "#b57edc"],
  ["Pink", "#ec8fb5"],
  ["Hot Pink", "#ff5fa2"],
  ["Magenta", "#d63384"],
  ["Gold", "#d4af37"],
  ["Silver", "#c0c0c6"],
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Nearest palette colour — weighted for how the eye reads green vs blue. */
export function colorNameFromHex(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  let best = NAMED_COLORS[0][0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const [name, paletteHex] of NAMED_COLORS) {
    const [pr, pg, pb] = hexToRgb(paletteHex);
    const distance = 2 * (r - pr) ** 2 + 4 * (g - pg) ** 2 + 3 * (b - pb) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = name;
    }
  }
  return best;
}

type PixelBuffer = { data: ArrayLike<number>; width?: number; height?: number };

/**
 * Dominant colour of a canvas buffer.
 *
 * 1. the border is sampled to learn the backdrop colour,
 * 2. backdrop pixels and near-white pixels are dropped (studio shots are
 *    usually cut out on white),
 * 3. the remaining pixels are bucketed into a 16-level histogram and the
 *    densest bucket wins; if filtering removed almost everything (a white
 *    product) the histogram falls back to every pixel.
 */
export function dominantColorFromImageData(imageData: PixelBuffer): string | null {
  const data = imageData.data;
  const total = Math.floor(data.length / 4);
  if (total <= 0) return null;

  const width = imageData.width ?? Math.floor(Math.sqrt(total));
  const height = imageData.height ?? Math.floor(total / Math.max(1, width));
  if (width < 1 || height < 1) return null;

  const visible = (i: number) => data[i * 4 + 3] >= 128;

  // --- backdrop estimate from a 2px frame -----------------------------------
  let br = 0;
  let bg = 0;
  let bb = 0;
  let borderCount = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const edge = x < 2 || y < 2 || x >= width - 2 || y >= height - 2;
      if (!edge) continue;
      const i = y * width + x;
      if (!visible(i)) continue;
      br += data[i * 4];
      bg += data[i * 4 + 1];
      bb += data[i * 4 + 2];
      borderCount++;
    }
  }
  if (borderCount === 0) {
    for (let i = 0; i < total; i++) {
      if (!visible(i)) continue;
      br += data[i * 4];
      bg += data[i * 4 + 1];
      bb += data[i * 4 + 2];
      borderCount++;
    }
  }
  if (borderCount === 0) return null;
  br /= borderCount;
  bg /= borderCount;
  bb /= borderCount;

  const nearBackground = (r: number, g: number, b: number) => {
    const white = r >= 244 && g >= 244 && b >= 244;
    const distance = Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);
    return white || distance < 45;
  };

  const histogram = new Map<number, { count: number; r: number; g: number; b: number }>();
  let considered = 0;

  const add = (i: number, skipBackground: boolean) => {
    if (!visible(i)) return;
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    if (skipBackground && nearBackground(r, g, b)) return;
    considered++;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = histogram.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    histogram.set(key, bucket);
  };

  for (let i = 0; i < total; i++) add(i, true);
  if (considered < total * 0.08) {
    histogram.clear();
    considered = 0;
    for (let i = 0; i < total; i++) add(i, false);
  }
  if (considered === 0) return null;

  let best: { count: number; r: number; g: number; b: number } | null = null;
  for (const bucket of histogram.values()) {
    if (!best || bucket.count > best.count) best = bucket;
  }
  if (!best || best.count < considered * 0.04) return null;

  return rgbToHex(best.r / best.count, best.g / best.count, best.b / best.count);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined") {
      reject(new Error("no image support"));
      return;
    }
    const img = new Image();
    // Remote images need CORS to stay readable by the canvas; data URLs do not.
    if (!url.startsWith("data:")) img.crossOrigin = "anonymous";
    const timer = setTimeout(() => reject(new Error("image timeout")), 6000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("image failed to load"));
    };
    img.src = url;
  });
}

const SAMPLE_SIZE = 96;

/** Centre-cropped `object-fit: cover` draw so ratios never skew the sample. */
async function colorFromImage(url: string): Promise<string | null> {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const scale = Math.max(SAMPLE_SIZE / img.naturalWidth, SAMPLE_SIZE / img.naturalHeight);
  const drawWidth = img.naturalWidth * scale;
  const drawHeight = img.naturalHeight * scale;
  ctx.drawImage(
    img,
    (SAMPLE_SIZE - drawWidth) / 2,
    (SAMPLE_SIZE - drawHeight) / 2,
    drawWidth,
    drawHeight
  );

  try {
    const pixels = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return dominantColorFromImageData(pixels);
  } catch {
    // Tainted canvas (remote image without CORS) — nothing we can read.
    return null;
  }
}

/**
 * Detects the dominant colour of each product image (first 4) and returns one
 * candidate per distinct colour name so the user can review and pick the right
 * one when the gallery mixes colours.
 */
export async function detectImageColors(urls: string[], limit = 4): Promise<DetectedColor[]> {
  const candidates: DetectedColor[] = [];
  const source = (urls ?? []).filter(Boolean).slice(0, limit);
  for (let i = 0; i < source.length; i++) {
    const url = source[i];
    try {
      const hex = await colorFromImage(url);
      if (!hex) continue;
      const name = colorNameFromHex(hex);
      if (candidates.some((c) => c.name === name)) continue;
      candidates.push({ hex, name, index: i + 1, sourceUrl: url });
    } catch {
      // Skip images that cannot be read (broken link, CORS, timeout).
    }
  }
  return candidates;
}
