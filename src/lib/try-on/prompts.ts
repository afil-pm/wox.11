/**
 * Deterministic garment-prompt builder for the Anywear / Decart virtual
 * try-on flow. Pure functions, no I/O: the prompt is derived only from
 * catalogue data (category + variant colour), never from free text, so no
 * invented patterns, logos, or fabrics can leak into the model prompt.
 */

export type TryOnGarmentKind = "top" | "bottom";

export interface TryOnGarmentInput {
  categorySlug: string;
  categoryName: string;
  color?: string | null;
}

const TOP_HINTS = ["shirt", "tee", "t-shirt", "tshirt", "top", "kurta", "jacket", "hoodie"];
const BOTTOM_HINTS = ["pant", "jean", "trouser", "short", "bottom", "legging", "skirt"];

function normalizedHaystack(slug: string, name: string): string {
  return `${slug} ${name}`.toLowerCase();
}

export function garmentKindForCategory(categorySlug: string, categoryName: string): TryOnGarmentKind {
  const hay = normalizedHaystack(categorySlug, categoryName);
  if (BOTTOM_HINTS.some((hint) => hay.includes(hint))) return "bottom";
  if (TOP_HINTS.some((hint) => hay.includes(hint))) return "top";
  return "top";
}

/** "Men's T-Shirts" -> "t-shirt"; "Boys' Pants" -> "pants". */
export function garmentNounForCategory(categoryName: string): string {
  const rest = categoryName
    .replace(/^(men's|boys'|boys|women's|girls'|girls|kids'|kids|unisex)\s+/i, "")
    .trim()
    .toLowerCase();
  if (/^t-?shirts?$/.test(rest) || rest === "tees" || rest === "tee") return "t-shirt";
  if (rest === "shirts" || rest === "shirt") return "shirt";
  if (rest === "pants" || rest === "shorts" || rest === "jeans" || rest === "trousers") return rest;
  if (rest.endsWith("s") && rest.length > 3) return rest.slice(0, -1);
  return rest || "garment";
}

function articleFor(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

export function buildGarmentPrompt(input: TryOnGarmentInput): {
  prompt: string;
  kind: TryOnGarmentKind;
} {
  const kind = garmentKindForCategory(input.categorySlug, input.categoryName);
  const color = (input.color || "").trim().toLowerCase();
  let noun = garmentNounForCategory(input.categoryName);
  if (color && noun.startsWith(`${color} `)) {
    noun = noun.slice(color.length + 1);
  }

  if (kind === "bottom") {
    const garment = color ? `a pair of ${color} ${noun}` : "a pair of pants";
    return {
      kind,
      prompt: `Substitute the current pants with ${garment} in a relaxed casual fit with natural drape and soft fabric texture`,
    };
  }

  const garment = color
    ? `${articleFor(color)} ${color} ${noun}`
    : `${articleFor(noun)} ${noun}`;
  return {
    kind,
    prompt: `Substitute the current top with ${garment} in a relaxed casual fit with natural drape and soft fabric texture`,
  };
}

/** The Try On button renders only when the product actually has an image. */
export function isTryOnEligible(imageUrl: unknown): imageUrl is string {
  return typeof imageUrl === "string" && imageUrl.trim().length > 0;
}
