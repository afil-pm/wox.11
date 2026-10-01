import type { SpecField, SpecTemplate } from "./types";

/**
 * Starting points the admin can edit, reorder or throw away. They are only a
 * fallback: a template saved from the admin panel always wins, and a category
 * without any template simply shows no structured specification fields.
 */
function field(partial: Partial<SpecField> & Pick<SpecField, "key" | "label" | "type">): SpecField {
  return {
    options: [],
    allowCustom: false,
    required: false,
    placeholder: "",
    ...partial,
  };
}

const PATTERN_OPTIONS = [
  "Solid",
  "Striped",
  "Checked",
  "Plaid",
  "Printed",
  "Textured",
  "Floral",
  "Camouflage",
];

const CARE_OPTIONS = [
  "Machine Wash",
  "Hand Wash",
  "Do Not Bleach",
  "Do Not Tumble Dry",
  "Iron Low",
  "Dry Clean",
];

const OCCASION_OPTIONS = ["Casual", "Formal", "Sports", "Party", "Festive"];

const COUNTRY_FIELD = field({
  key: "countryOfOrigin",
  label: "Country of Origin",
  type: "text",
  placeholder: "e.g. India",
});

const CARE_FIELD = field({
  key: "careInstructions",
  label: "Care Instructions",
  type: "multiselect",
  options: CARE_OPTIONS,
  allowCustom: true,
});

export const DEFAULT_SPEC_TEMPLATES: SpecTemplate[] = [
  {
    id: "",
    categoryType: "pants",
    name: "Pants",
    fields: [
      field({
        key: "fit",
        label: "Fit",
        type: "select",
        options: ["Regular", "Slim", "Skinny", "Relaxed", "Straight", "Tapered", "Bootcut", "Athletic"],
        allowCustom: true,
      }),
      field({
        key: "material",
        label: "Material",
        type: "select",
        options: ["100% Cotton", "100% Organic Cotton", "Cotton Blend", "Polyester", "Linen", "Denim", "Viscose", "Rayon"],
        allowCustom: true,
      }),
      field({ key: "pattern", label: "Pattern", type: "select", options: PATTERN_OPTIONS, allowCustom: true }),
      field({
        key: "waistType",
        label: "Waist Type",
        type: "select",
        options: ["Low Rise", "Mid Rise", "High Rise", "Elasticated"],
        allowCustom: true,
      }),
      field({
        key: "length",
        label: "Length",
        type: "select",
        options: ["Full Length", "Ankle Length", "Cropped", "Capri"],
        allowCustom: true,
      }),
      field({
        key: "closureType",
        label: "Closure Type",
        type: "select",
        options: ["Button & Zipper", "Drawstring", "Elastic", "Zipper", "Pull-On"],
        allowCustom: true,
      }),
      field({ key: "pockets", label: "Pockets", type: "number", placeholder: "e.g. 5" }),
      field({ key: "occasion", label: "Occasion", type: "select", options: OCCASION_OPTIONS, allowCustom: true }),
      CARE_FIELD,
      COUNTRY_FIELD,
    ],
  },
  {
    id: "",
    categoryType: "shirts",
    name: "Shirts",
    fields: [
      field({
        key: "fit",
        label: "Fit",
        type: "select",
        options: ["Regular", "Slim", "Relaxed", "Oversized"],
        allowCustom: true,
      }),
      field({
        key: "fabric",
        label: "Fabric",
        type: "select",
        options: ["100% Cotton", "Oxford Cotton", "Poplin", "Linen", "Cotton Blend", "Rayon", "Polyester"],
        allowCustom: true,
      }),
      field({
        key: "collar",
        label: "Collar",
        type: "select",
        options: ["Button Down", "Spread", "Point", "Cutaway", "Camp", "Mandarin"],
        allowCustom: true,
      }),
      field({
        key: "sleeveType",
        label: "Sleeve Type",
        type: "select",
        options: ["Full Sleeve", "Half Sleeve", "Roll-Up Sleeve", "Sleeveless"],
        allowCustom: true,
      }),
      field({ key: "pattern", label: "Pattern", type: "select", options: PATTERN_OPTIONS, allowCustom: true }),
      field({
        key: "neckType",
        label: "Neck Type",
        type: "select",
        options: ["Round Neck", "V-Neck", "Henley", "Polo"],
        allowCustom: true,
      }),
      field({
        key: "closureType",
        label: "Closure Type",
        type: "select",
        options: ["Button", "Snap", "Zipper"],
        allowCustom: true,
      }),
      CARE_FIELD,
      COUNTRY_FIELD,
    ],
  },
  {
    id: "",
    categoryType: "t-shirts",
    name: "T-Shirts",
    fields: [
      field({
        key: "fit",
        label: "Fit",
        type: "select",
        options: ["Regular", "Slim", "Relaxed", "Oversized", "Muscle Fit"],
        allowCustom: true,
      }),
      field({
        key: "fabric",
        label: "Fabric",
        type: "select",
        options: ["100% Cotton", "Cotton Blend", "Polyester", "French Terry", "Jersey"],
        allowCustom: true,
      }),
      field({
        key: "collar",
        label: "Collar",
        type: "select",
        options: ["Crew Neck", "V-Neck", "Polo Collar", "Turtleneck", "None"],
        allowCustom: true,
      }),
      field({
        key: "sleeveType",
        label: "Sleeve Type",
        type: "select",
        options: ["Full Sleeve", "Half Sleeve", "Sleeveless", "Cap Sleeve"],
        allowCustom: true,
      }),
      field({ key: "pattern", label: "Pattern", type: "select", options: PATTERN_OPTIONS, allowCustom: true }),
      field({
        key: "neckType",
        label: "Neck Type",
        type: "select",
        options: ["Crew", "V-Neck", "Round", "Henley"],
        allowCustom: true,
      }),
      CARE_FIELD,
      COUNTRY_FIELD,
    ],
  },
  {
    id: "",
    categoryType: "shoes",
    name: "Shoes",
    fields: [
      field({
        key: "size",
        label: "Size",
        type: "select",
        options: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "US 7", "US 8", "US 9", "US 10"],
        allowCustom: true,
      }),
      field({
        key: "material",
        label: "Material",
        type: "select",
        options: ["Leather", "Synthetic", "Canvas", "Mesh", "Suede", "Knit"],
        allowCustom: true,
      }),
      field({
        key: "soleType",
        label: "Sole Type",
        type: "select",
        options: ["Rubber", "EVA", "TPR", "Leather", "Foam"],
        allowCustom: true,
      }),
      field({
        key: "closureType",
        label: "Closure Type",
        type: "select",
        options: ["Lace-Up", "Slip-On", "Velcro", "Zipper", "Elastic"],
        allowCustom: true,
      }),
      field({
        key: "toeShape",
        label: "Toe Shape",
        type: "select",
        options: ["Round Toe", "Square Toe", "Pointed Toe", "Almond Toe"],
        allowCustom: true,
      }),
      field({ key: "occasion", label: "Occasion", type: "select", options: OCCASION_OPTIONS, allowCustom: true }),
      CARE_FIELD,
      COUNTRY_FIELD,
    ],
  },
];

export function defaultTemplateFor(categoryType: string): SpecTemplate | null {
  const key = categoryType.trim().toLowerCase();
  const match = DEFAULT_SPEC_TEMPLATES.find((t) => t.categoryType === key);
  return match ? { ...match, fields: match.fields.map((f) => ({ ...f, options: [...f.options] })) } : null;
}
