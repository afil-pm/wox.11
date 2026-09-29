import type {
  SpecField,
  SpecFieldType,
  SpecRole,
  SpecRow,
  SpecTemplate,
  SpecValue,
  SpecValuesInput,
} from "./types";
import { SPEC_FIELD_TYPES } from "./types";

export const SPEC_LABEL_MAX = 80;
export const SPEC_VALUE_MAX = 300;
export const SPEC_OPTION_MAX = 80;
export const SPEC_OPTIONS_MAX = 40;
export const SPEC_FIELDS_MAX = 60;
export const SPEC_MULTICHOICE_MAX = 20;

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/** "Waist Type" / "waistType" -> "waist-type"; empty labels stay empty. */
export function specKey(label: string): string {
  return cleanText(label, SPEC_LABEL_MAX)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Human label for an orphaned key so older values stay readable. */
export function prettifySpecKey(key: string): string {
  return key
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, SPEC_LABEL_MAX);
}

export function normalizeSpecField(raw: unknown, usedKeys: Set<string>): SpecField | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;

  const label = cleanText(input.label, SPEC_LABEL_MAX);
  if (!label) return null;

  const type: SpecFieldType = SPEC_FIELD_TYPES.includes(input.type as SpecFieldType)
    ? (input.type as SpecFieldType)
    : "text";

  // Keys are stable: an existing key is kept when the label is renamed so
  // every stored product value keeps matching the field.
  const requested = specKey(typeof input.key === "string" ? input.key : "") || specKey(label);
  let key = requested || `spec-${usedKeys.size + 1}`;
  let suffix = 2;
  while (usedKeys.has(key)) {
    key = `${requested}-${suffix++}`;
  }
  usedKeys.add(key);

  const options = Array.isArray(input.options)
    ? input.options
        .map((o) => cleanText(o, SPEC_OPTION_MAX))
        .filter(Boolean)
        .filter((o, i, all) => all.indexOf(o) === i)
        .slice(0, SPEC_OPTIONS_MAX)
    : [];

  return {
    key,
    label,
    type,
    options,
    allowCustom: asBool(input.allowCustom, false),
    required: asBool(input.required, false),
    supplierEditable: asBool(input.supplierEditable, true),
    placeholder: cleanText(input.placeholder, 120),
  };
}

export type SpecTemplateResult =
  | { ok: true; template: SpecTemplate }
  | { ok: false; error: string };

/** Validates a template sent by the admin panel before it is persisted. */
export function normalizeSpecTemplate(raw: unknown): SpecTemplateResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Template payload is missing" };
  }
  const input = raw as Record<string, unknown>;

  const categoryType = specKey(String(input.categoryType ?? ""));
  if (!categoryType) {
    return { ok: false, error: "A category key is required" };
  }

  const name = cleanText(input.name, 60) || prettifySpecKey(categoryType);

  const rawFields = Array.isArray(input.fields) ? input.fields.slice(0, SPEC_FIELDS_MAX) : [];
  const usedKeys = new Set<string>();
  const fields: SpecField[] = [];
  for (const rawField of rawFields) {
    const field = normalizeSpecField(rawField, usedKeys);
    if (field) fields.push(field);
  }

  return {
    ok: true,
    template: {
      id: typeof input.id === "string" ? input.id : "",
      categoryType,
      name,
      fields,
      allowSupplierCustom: asBool(input.allowSupplierCustom, true),
    },
  };
}

interface CoerceResult {
  value: string;
  error?: string;
}

function coerceFieldValue(field: SpecField, raw: unknown): CoerceResult {
  switch (field.type) {
    case "number": {
      if (raw === "" || raw === null || raw === undefined) return { value: "" };
      const num = typeof raw === "number" ? raw : Number(String(raw).trim());
      if (!Number.isFinite(num)) return { value: "", error: "must be a number" };
      return { value: String(num).slice(0, 40) };
    }
    case "boolean": {
      if (raw === "" || raw === null || raw === undefined) return { value: "" };
      if (raw === true || raw === false) return { value: String(raw) };
      const text = String(raw).trim().toLowerCase();
      if (["true", "yes", "1", "on"].includes(text)) return { value: "true" };
      if (["false", "no", "0", "off"].includes(text)) return { value: "false" };
      return { value: "", error: "must be yes or no" };
    }
    case "multiselect": {
      const items = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
          ? raw.split(",")
          : [];
      const cleaned = items
        .map((item) => cleanText(item, SPEC_OPTION_MAX))
        .filter(Boolean)
        .filter((item, i, all) => all.indexOf(item) === i)
        .slice(0, SPEC_MULTICHOICE_MAX);

      const rejected = cleaned.filter(
        (item) => !field.allowCustom && field.options.length > 0 && !field.options.includes(item)
      );
      if (rejected.length > 0) {
        return { value: "", error: `has an unsupported option (${rejected[0]})` };
      }
      return { value: cleaned.join(", ").slice(0, SPEC_VALUE_MAX) };
    }
    case "select": {
      const value = cleanText(raw, SPEC_OPTION_MAX);
      if (!value) return { value: "" };
      if (!field.allowCustom && field.options.length > 0 && !field.options.includes(value)) {
        return { value: "", error: "must be one of the available options" };
      }
      return { value: value.slice(0, SPEC_VALUE_MAX) };
    }
    default: {
      const value = cleanText(raw, SPEC_VALUE_MAX);
      return { value };
    }
  }
}

export interface NormalizeSpecValuesResult {
  specValues: SpecValue[];
  errors: string[];
}

/**
 * Turns the raw form payload into the stored `{key, value}` list.
 *
 * - suppliers only ever touch fields the admin marked `supplierEditable`;
 *   every other stored value is carried over untouched from `previous`,
 * - unknown keys are ignored so a supplier cannot invent template fields,
 * - required fields (that the caller may edit) must hold a value.
 */
export function normalizeSpecValues(
  raw: unknown,
  fields: SpecField[],
  options: { role: SpecRole; previous?: SpecValue[] }
): NormalizeSpecValuesResult {
  const input: SpecValuesInput =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as SpecValuesInput)
      : {};
  const previous = new Map<string, string>(
    (Array.isArray(options.previous) ? options.previous : []).map((v) => [v.key, v.value])
  );

  const errors: string[] = [];
  const specValues: SpecValue[] = [];

  for (const field of fields) {
    const editable = options.role === "admin" || field.supplierEditable;

    if (!editable) {
      const kept = previous.get(field.key);
      if (kept) specValues.push({ key: field.key, value: kept });
      continue;
    }

    const present = Object.prototype.hasOwnProperty.call(input, field.key);
    if (!present) {
      const kept = previous.get(field.key);
      if (kept) {
        specValues.push({ key: field.key, value: kept });
        continue;
      }
      // Nothing stored yet either: a required field must be filled now.
      if (field.required) {
        errors.push(`${field.label} is required`);
      }
      continue;
    }

    const { value, error } = coerceFieldValue(field, input[field.key]);
    if (error) {
      errors.push(`${field.label} ${error}`);
      continue;
    }
    if (value) {
      specValues.push({ key: field.key, value });
    } else if (field.required) {
      errors.push(`${field.label} is required`);
    }
  }

  return { specValues, errors };
}

/** Display value for a stored value (booleans read as Yes/No on the page). */
export function formatSpecValue(field: SpecField | undefined, value: string): string {
  if (field?.type === "boolean") {
    if (value === "true") return "Yes";
    if (value === "false") return "No";
  }
  return value;
}

/**
 * Resolves the rows the product page shows: template fields in template order,
 * then any values whose field was removed from the template (still readable,
 * never silently lost), then the free-form rows.
 */
export function resolveSpecRows(
  fields: SpecField[],
  specValues: SpecValue[],
  customRows: { label: string; value: string }[] = []
): SpecRow[] {
  const byKey = new Map(specValues.map((v) => [v.key, v.value]));
  const rows: SpecRow[] = [];
  const seen = new Set<string>();

  for (const field of fields) {
    const value = byKey.get(field.key);
    if (!value) continue;
    seen.add(field.key);
    rows.push({ label: field.label, value: formatSpecValue(field, value) });
  }

  for (const spec of specValues) {
    if (seen.has(spec.key)) continue;
    rows.push({ label: prettifySpecKey(spec.key), value: spec.value });
  }

  for (const row of customRows) {
    const label = cleanText(row?.label, SPEC_LABEL_MAX);
    const value = cleanText(row?.value, SPEC_VALUE_MAX);
    if (label && value) rows.push({ label, value });
  }

  return rows;
}

/** Fields a given role is allowed to see/edit — used when serving templates. */
export function visibleSpecFields(fields: SpecField[], role: SpecRole): SpecField[] {
  if (role === "admin") return fields;
  return fields.filter((field) => field.supplierEditable);
}
