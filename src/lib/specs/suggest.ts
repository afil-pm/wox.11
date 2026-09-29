import type { SpecField } from "./types";

/**
 * "Quick Choose": turns (category + product name) into a relevant set of
 * specification rows so suppliers/admins do not have to type every field.
 *
 * The labels deliberately mirror the default category templates in
 * `./defaults.ts` (Fit, Fabric, Sleeve Type…) so a generated value lands in the
 * structured field when one exists, and becomes a free-form row when it does
 * not.
 */

export type SpecSuggestion = { label: string; value: string };

export type QuickChooseCategory = {
  name?: string;
  type?: string;
  gender?: string;
} | null;

type Rule = [term: string, value: string];

function firstMatch(text: string, rules: Rule[]): string | null {
  for (const [term, value] of rules) {
    if (text.includes(term)) return value;
  }
  return null;
}

/** "Colour" and "Color" (and stray casing) mean the same row. */
export function normalizeSpecLabel(label: string): string {
  return String(label ?? "")
    .trim()
    .toLowerCase()
    .replace(/\bcolou?r\b/g, "color")
    .replace(/\s+/g, " ");
}

export function isColorLabel(label: string): boolean {
  return normalizeSpecLabel(label) === "color";
}

function categoryTypeKey(category: QuickChooseCategory): string {
  const raw = `${category?.type || ""} ${category?.name || ""}`.toLowerCase();
  if (raw.includes("t-shirt") || raw.includes("tshirt") || raw.includes("t shirt")) return "t-shirts";
  if (raw.includes("shirt")) return "shirts";
  if (raw.includes("pant") || raw.includes("jean") || raw.includes("trouser") || raw.includes("short")) return "pants";
  if (raw.includes("shoe") || raw.includes("sneaker") || raw.includes("footwear")) return "shoes";
  return "";
}

const FIT_RULES: Rule[] = [
  ["slim fit", "Slim"],
  ["slim", "Slim"],
  ["skinny", "Skinny"],
  ["muscle fit", "Muscle Fit"],
  ["oversized", "Oversized"],
  ["boxy", "Oversized"],
  ["relaxed", "Relaxed"],
  ["loose", "Relaxed"],
  ["tapered", "Tapered"],
  ["bootcut", "Bootcut"],
  ["straight", "Straight"],
  ["athletic", "Athletic"],
  ["regular", "Regular"],
  ["classic", "Regular"],
];

const PATTERN_RULES: Rule[] = [
  ["plaid", "Plaid"],
  ["checkered", "Checked"],
  ["checked", "Checked"],
  ["stripe", "Striped"],
  ["floral", "Floral"],
  ["camo", "Camouflage"],
  ["tie-dye", "Tie Dye"],
  ["graphic", "Printed"],
  ["printed", "Printed"],
  ["logo", "Printed"],
  ["textured", "Textured"],
  ["polka", "Polka Dot"],
  ["dotted", "Polka Dot"],
  ["solid", "Solid"],
];

const OCCASION_RULES: Rule[] = [
  ["formal", "Formal"],
  ["office", "Formal"],
  ["business", "Formal"],
  ["party", "Party"],
  ["festive", "Festive"],
  ["wedding", "Festive"],
  ["sports", "Sports"],
  ["gym", "Sports"],
  ["yoga", "Sports"],
  ["running", "Sports"],
  ["workout", "Sports"],
  ["casual", "Casual"],
];

const SLEEVE_RULES: Rule[] = [
  ["full sleeve", "Full Sleeve"],
  ["long sleeve", "Full Sleeve"],
  ["half sleeve", "Half Sleeve"],
  ["short sleeve", "Half Sleeve"],
  ["cap sleeve", "Cap Sleeve"],
  ["roll-up", "Roll-Up Sleeve"],
  ["sleeveless", "Sleeveless"],
  ["sleeve free", "Sleeveless"],
  ["tank", "Sleeveless"],
];

const SHIRT_COLLAR_RULES: Rule[] = [
  ["mandarin", "Mandarin"],
  ["nehru", "Mandarin"],
  ["button down", "Button Down"],
  ["cutaway", "Cutaway"],
  ["camp", "Camp"],
];

const SHIRT_NECK_RULES: Rule[] = [
  ["polo", "Polo"],
  ["v-neck", "V-Neck"],
  ["v neck", "V-Neck"],
  ["henley", "Henley"],
  ["crew", "Round Neck"],
  ["round neck", "Round Neck"],
];

const TSHIRT_COLLAR_RULES: Rule[] = [
  ["turtleneck", "Turtleneck"],
  ["turtle neck", "Turtleneck"],
  ["polo", "Polo Collar"],
  ["v-neck", "V-Neck"],
  ["v neck", "V-Neck"],
  ["crew", "Crew Neck"],
  ["round neck", "Crew Neck"],
];

const TSHIRT_NECK_RULES: Rule[] = [
  ["v-neck", "V-Neck"],
  ["v neck", "V-Neck"],
  ["henley", "Henley"],
  ["crew", "Crew"],
  ["round", "Round"],
];

const SHIRT_FABRIC_RULES: Rule[] = [
  ["oxford", "Oxford Cotton"],
  ["poplin", "Poplin"],
  ["linen", "Linen"],
  ["100% cotton", "100% Cotton"],
  ["cotton", "100% Cotton"],
  ["polyester", "Polyester"],
  ["rayon", "Rayon"],
  ["silk", "Silk"],
  ["blend", "Cotton Blend"],
];

const TSHIRT_FABRIC_RULES: Rule[] = [
  ["french terry", "French Terry"],
  ["terry", "French Terry"],
  ["jersey", "Jersey"],
  ["100% cotton", "100% Cotton"],
  ["cotton", "100% Cotton"],
  ["polyester", "Polyester"],
  ["blend", "Cotton Blend"],
];

const PANTS_MATERIAL_RULES: Rule[] = [
  ["denim", "Denim"],
  ["jean", "Denim"],
  ["linen", "Linen"],
  ["chino", "100% Cotton"],
  ["cotton", "100% Cotton"],
  ["polyester", "Polyester"],
  ["viscose", "Viscose"],
  ["rayon", "Rayon"],
  ["khaki", "Cotton Blend"],
];

const PANTS_FIT_RULES: Rule[] = [
  ["skinny", "Skinny"],
  ["slim", "Slim"],
  ["tapered", "Tapered"],
  ["bootcut", "Bootcut"],
  ["straight", "Straight"],
  ["relaxed", "Relaxed"],
  ["loose", "Relaxed"],
  ["athletic", "Athletic"],
  ["jogger", "Athletic"],
  ["regular", "Regular"],
  ["classic", "Regular"],
];

const SHOES_MATERIAL_RULES: Rule[] = [
  ["leather", "Leather"],
  ["suede", "Suede"],
  ["canvas", "Canvas"],
  ["mesh", "Mesh"],
  ["knit", "Knit"],
  ["synthetic", "Synthetic"],
];

const SHOES_CLOSURE_RULES: Rule[] = [
  ["lace", "Lace-Up"],
  ["slip on", "Slip-On"],
  ["slip-on", "Slip-On"],
  ["velcro", "Velcro"],
  ["zip", "Zipper"],
];

function patternValue(name: string): string {
  return firstMatch(name, PATTERN_RULES) || "Solid";
}

function occasionValue(name: string): string {
  return firstMatch(name, OCCASION_RULES) || "Casual";
}

function careValue(name: string): string {
  if (name.includes("silk") || name.includes("wool")) return "Dry Clean";
  if (name.includes("hand wash")) return "Hand Wash";
  return "Machine Wash";
}

/**
 * Builds the suggested specification rows for a product.
 *
 * Only relevant fields are produced (a shirt never gets "Sole Type"), values
 * are inferred from the product name where a safe signal exists, and unknowns
 * stay empty instead of inventing data.
 */
export function suggestSpecs(
  category: QuickChooseCategory,
  productName: string,
  options: { hasTemplate?: boolean } = {}
): SpecSuggestion[] {
  const hasTemplate = options.hasTemplate === true;
  const name = String(productName ?? "").toLowerCase().trim();
  const type = categoryTypeKey(category);
  const rows: SpecSuggestion[] = [{ label: "Color", value: "" }];

  // Empty rows are only useful when the category has no structured fields to
  // fill — otherwise they are noise the user has to delete.
  const push = (label: string, value: string | null) => {
    if (value) rows.push({ label, value });
    else if (!hasTemplate) rows.push({ label, value: "" });
  };

  if (type === "shirts") {
    push("Fit", firstMatch(name, FIT_RULES) || "Regular");
    push("Fabric", firstMatch(name, SHIRT_FABRIC_RULES));
    push("Collar", firstMatch(name, SHIRT_COLLAR_RULES));
    push("Sleeve Type", firstMatch(name, SLEEVE_RULES));
    push("Neck Type", firstMatch(name, SHIRT_NECK_RULES));
    push(
      "Closure Type",
      name.includes("snap") ? "Snap" : name.includes("zip") ? "Zipper" : "Button"
    );
    push("Pattern", patternValue(name));
    push("Occasion", occasionValue(name));
    push("Care Instructions", careValue(name));
    return rows;
  }

  if (type === "t-shirts") {
    push("Fit", firstMatch(name, FIT_RULES) || "Regular");
    push("Fabric", firstMatch(name, TSHIRT_FABRIC_RULES));
    push("Collar", firstMatch(name, TSHIRT_COLLAR_RULES));
    push("Neck Type", firstMatch(name, TSHIRT_NECK_RULES));
    push("Sleeve Type", firstMatch(name, SLEEVE_RULES));
    push("Pattern", patternValue(name));
    push("Occasion", occasionValue(name));
    push("Care Instructions", careValue(name));
    return rows;
  }

  if (type === "pants") {
    push("Fit", firstMatch(name, PANTS_FIT_RULES) || "Regular");
    push("Material", firstMatch(name, PANTS_MATERIAL_RULES));
    const isShorts = name.includes("short");
    push("Waist Type", firstMatch(name, [
      ["high rise", "High Rise"],
      ["low rise", "Low Rise"],
      ["mid rise", "Mid Rise"],
      ["elastic", "Elasticated"],
      ["drawstring", "Elasticated"],
      ["jogger", "Elasticated"],
    ]) || "Mid Rise");
    if (!isShorts) {
      push(
        "Length",
        firstMatch(name, [
          ["capri", "Capri"],
          ["cropped", "Cropped"],
          ["ankle", "Ankle Length"],
          ["full length", "Full Length"],
        ]) || "Full Length"
      );
    }
    push(
      "Closure Type",
      firstMatch(name, [
        ["drawstring", "Drawstring"],
        ["jogger", "Drawstring"],
        ["elastic", "Elastic"],
        ["pull-on", "Pull-On"],
        ["zip", "Button & Zipper"],
      ]) || "Button & Zipper"
    );
    push("Pattern", patternValue(name));
    push("Occasion", occasionValue(name));
    push("Care Instructions", careValue(name));
    return rows;
  }

  if (type === "shoes") {
    push("Material", firstMatch(name, SHOES_MATERIAL_RULES));
    push("Sole Type", name.includes("rubber") ? "Rubber" : name.includes("foam") ? "Foam" : null);
    push("Closure Type", firstMatch(name, SHOES_CLOSURE_RULES));
    push("Occasion", occasionValue(name));
    return rows;
  }

  // Unknown / other category: stay minimal instead of guessing fields.
  push("Material", firstMatch(name, [...SHIRT_FABRIC_RULES, ...SHOES_MATERIAL_RULES]));
  push("Pattern", firstMatch(name, PATTERN_RULES));
  if (!hasTemplate) {
    push("Occasion", occasionValue(name));
    push("Care Instructions", careValue(name));
  }
  return rows;
}

/**
 * Merges the chosen suggestion rows into the editor state.
 *
 * - values never overwrite something the user already typed,
 * - rows matching a template field land in the structured values,
 * - everything else becomes a free-form row (when the user may add one),
 * - empty rows are skipped unless they are the Color row or there is no
 *   template at all to fill.
 */
export function applyQuickChooseRows(
  suggested: SpecSuggestion[],
  options: {
    fields: SpecField[];
    values: Record<string, string>;
    customRows: { label: string; value: string }[];
    canAddCustom: boolean;
  }
): { values: Record<string, string>; customRows: { label: string; value: string }[] } {
  const values = { ...options.values };
  const customRows = [...options.customRows];
  const hasTemplate = options.fields.length > 0;

  for (const row of suggested) {
    const label = String(row.label ?? "").trim();
    if (!label) continue;
    const value = String(row.value ?? "").trim();
    const color = isColorLabel(label);

    const field = options.fields.find(
      (f) => normalizeSpecLabel(f.label) === normalizeSpecLabel(label)
    );
    if (field) {
      if (value && !String(values[field.key] ?? "").trim()) values[field.key] = value;
      continue;
    }

    if (!options.canAddCustom) continue;
    if (!value && !color && hasTemplate) continue;

    const index = customRows.findIndex(
      (r) => normalizeSpecLabel(r.label) === normalizeSpecLabel(label)
    );
    if (index >= 0) {
      if (value && !String(customRows[index].value ?? "").trim()) {
        customRows[index] = { ...customRows[index], value };
      }
      continue;
    }
    customRows.push({ label, value });
  }

  return { values, customRows };
}
