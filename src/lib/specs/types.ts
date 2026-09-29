/**
 * Shared shapes for the category specific product specification system.
 *
 * Templates describe *which* fields a category exposes (admin controlled),
 * products store the *values* for those fields, and both stay separate so a
 * rename or reorder in the admin panel updates every product at once.
 */

export type SpecFieldType = "text" | "select" | "multiselect" | "number" | "boolean";

export const SPEC_FIELD_TYPES: SpecFieldType[] = [
  "text",
  "select",
  "multiselect",
  "number",
  "boolean",
];

export interface SpecField {
  /** Stable identifier used as the product value key; never renamed by label edits. */
  key: string;
  label: string;
  type: SpecFieldType;
  /** Predefined options for select/multiselect fields. */
  options: string[];
  /** Allow a free value next to the predefined options. */
  allowCustom: boolean;
  /** Admin marked the field as mandatory. */
  required: boolean;
  /** Suppliers may fill this field; off = admin only. */
  supplierEditable: boolean;
  placeholder: string;
}

export interface SpecTemplate {
  /** "" until the template has been persisted. */
  id: string;
  /** Category type the template applies to (e.g. "pants", "shirts", "shoes"). */
  categoryType: string;
  name: string;
  fields: SpecField[];
  /** Suppliers may add free-form label/value rows of their own. */
  allowSupplierCustom: boolean;
}

/** One stored product value: the field key plus its normalised string value. */
export interface SpecValue {
  key: string;
  value: string;
}

/** A ready-to-render row for the product details page. */
export interface SpecRow {
  label: string;
  value: string;
}

/** Raw product input, keyed by field key. */
export type SpecValuesInput = Record<string, unknown>;

export type SpecRole = "admin" | "supplier";
