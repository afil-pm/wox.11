"use client";

import { useId, useRef, useState } from "react";
import { Plus, Trash2, ListPlus, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SpecField } from "@/lib/specs/types";
import {
  applyQuickChooseRows,
  isColorLabel,
  suggestSpecs,
  type SpecSuggestion,
} from "@/lib/specs/suggest";
import { detectImageColors, type DetectedColor } from "@/lib/specs/image-color";

export type SpecRowInput = { label: string; value: string };

type SpecEditorProps = {
  fields: SpecField[];
  /** Structured values keyed by field key. */
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  /** Free-form label/value rows for anything the template does not cover. */
  customRows: SpecRowInput[];
  onCustomRowsChange: (next: SpecRowInput[]) => void;
  /** Suppliers only see this when the admin allowed custom rows. */
  canAddCustom?: boolean;
  loading?: boolean;
  /** Shown when the chosen category has no template yet. */
  emptyHint?: string;
  /** Quick Choose inputs — drive the generated fields and the colour detection. */
  productName?: string;
  productCategory?: { name?: string; type?: string; gender?: string } | null;
  imageUrls?: string[];
};

function optionChipClass(active: boolean) {
  return cn(
    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "border-zinc-900 bg-zinc-900 text-white ring-1 ring-zinc-900"
      : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
  );
}

/**
 * The category specific specification editor. Renders one input per template
 * field (text / dropdown / multi-select / number / yes-no) plus the free-form
 * rows, so admins and suppliers fill in exactly the fields the admin configured
 * — nothing more.
 */
export default function SpecEditor({
  fields,
  values,
  onChange,
  customRows,
  onCustomRowsChange,
  canAddCustom = true,
  loading = false,
  emptyHint,
  productName = "",
  productCategory = null,
  imageUrls = [],
}: SpecEditorProps) {
  const uid = useId();
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickRows, setQuickRows] = useState<SpecSuggestion[]>([]);
  const [colorCandidates, setColorCandidates] = useState<DetectedColor[]>([]);
  const [colorPhase, setColorPhase] = useState<"idle" | "loading" | "done">("idle");
  const [selectedColor, setSelectedColor] = useState(0);
  const quickTokenRef = useRef(0);

  function setValue(key: string, value: string) {
    onChange({ ...values, [key]: value });
  }

  function toggleMulti(key: string, option: string) {
    const current = (values[key] || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    onChange({ ...values, [key]: next.join(", ") });
  }

  function addCustomLabel(index: number, label: string) {
    onCustomRowsChange(customRows.map((row, i) => (i === index ? { ...row, label } : row)));
  }

  function addCustomValue(index: number, value: string) {
    onCustomRowsChange(customRows.map((row, i) => (i === index ? { ...row, value } : row)));
  }

  function openQuickChoose() {
    const token = ++quickTokenRef.current;
    setQuickRows(suggestSpecs(productCategory, productName, { hasTemplate: fields.length > 0 }));
    setSelectedColor(0);
    setColorCandidates([]);
    const urls = (imageUrls ?? []).filter(Boolean);
    setColorPhase(urls.length > 0 ? "loading" : "done");
    setQuickOpen(true);
    if (urls.length === 0) return;

    detectImageColors(urls)
      .then((candidates) => {
        if (quickTokenRef.current !== token) return;
        setColorCandidates(candidates);
        setColorPhase("done");
        if (candidates.length > 0) {
          setSelectedColor(0);
          setQuickRows((rows) =>
            rows.map((row) => (isColorLabel(row.label) ? { ...row, value: candidates[0].name } : row))
          );
        }
      })
      .catch(() => {
        if (quickTokenRef.current === token) setColorPhase("done");
      });
  }

  function closeQuickChoose() {
    quickTokenRef.current += 1;
    setQuickOpen(false);
  }

  function pickColor(index: number) {
    const candidate = colorCandidates[index];
    if (!candidate) return;
    setSelectedColor(index);
    setQuickRows((rows) =>
      rows.map((row) => (isColorLabel(row.label) ? { ...row, value: candidate.name } : row))
    );
  }

  function setQuickRow(index: number, patch: Partial<SpecSuggestion>) {
    setQuickRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function applyQuickChoose() {
    const merged = applyQuickChooseRows(quickRows, {
      fields,
      values,
      customRows,
      canAddCustom,
    });
    onChange(merged.values);
    onCustomRowsChange(merged.customRows);
    closeQuickChoose();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListPlus className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Specifications</span>
          <span className="text-xs text-gray-400">category specific</span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openQuickChoose} disabled={loading}>
            <Wand2 className="mr-1 h-3.5 w-3.5" /> Quick Choose
          </Button>
          {canAddCustom && (
            <span className="text-[11px] text-gray-400">
              or type them by hand under Custom specifications
            </span>
          )}
        </div>
      </div>

      {quickOpen && (
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                <Wand2 className="h-3.5 w-3.5" /> Quick Choose
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Generated from {productCategory?.name || "the category"} +{" "}
                <span className="font-medium">&ldquo;{productName || "product name"}&rdquo;</span>
                {imageUrls.length > 0
                  ? ` · ${imageUrls.length} image${imageUrls.length === 1 ? "" : "s"} analysed for colour`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={closeQuickChoose}
              aria-label="Close Quick Choose"
              className="text-gray-400 transition-colors hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <p className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-gray-600">
              Color
              {colorCandidates.length > 1 && (
                <span className="font-normal text-gray-400">
                  — multiple detected, pick the right one
                </span>
              )}
            </p>
            {colorPhase === "loading" ? (
              <p className="text-xs text-gray-400">Analysing product images…</p>
            ) : colorCandidates.length === 0 ? (
              <p className="text-xs text-gray-400">
                {imageUrls.length > 0
                  ? "No colour could be detected from these images — type it below."
                  : "No product images yet — upload images and the colour is detected automatically."}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {colorCandidates.map((candidate, index) => (
                  <button
                    key={`${candidate.name}-${candidate.index}`}
                    type="button"
                    onClick={() => pickColor(index)}
                    title={`Detected from image ${candidate.index}`}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      selectedColor === index
                        ? "border-zinc-900 bg-zinc-900 text-white ring-1 ring-zinc-900"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                    )}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: candidate.hex }}
                    />
                    {candidate.name}
                    {colorCandidates.length > 1 && (
                      <span className="text-[10px] opacity-70">img {candidate.index}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {quickRows.map((row, index) => (
              <div key={`${row.label}-${index}`} className="flex items-center gap-2">
                <span
                  className="w-1/3 min-w-0 truncate text-xs font-medium text-gray-600"
                  title={row.label}
                >
                  {row.label}
                </span>
                <Input
                  value={row.value}
                  onChange={(e) => setQuickRow(index, { value: e.target.value })}
                  placeholder={isColorLabel(row.label) ? "e.g. Navy Blue" : `Value for ${row.label}`}
                  className="h-8 flex-1"
                  maxLength={300}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuickRows((rows) => rows.filter((_, j) => j !== index))}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3">
            <Button
              type="button"
              size="sm"
              onClick={applyQuickChoose}
              disabled={quickRows.length === 0}
            >
              <Wand2 className="mr-1 h-3.5 w-3.5" />
              Apply {quickRows.length} specification{quickRows.length === 1 ? "" : "s"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={closeQuickChoose}>
              Cancel
            </Button>
            <span className="text-[11px] text-gray-400">
              Everything stays editable before you save.
            </span>
          </div>
          {!canAddCustom && (
            <p className="text-[11px] text-amber-600">
              Free-form specs are turned off for this category — only matching category fields will
              be applied.
            </p>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-400">Loading specification fields…</p>
      ) : fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-2.5 text-xs text-gray-400">
          {emptyHint ?? "No structured specification fields are configured for this category."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const value = values[field.key] ?? "";
            const listId = `${uid}-${field.key}`;

            return (
              <div key={field.key} className={cn(field.type === "multiselect" && "sm:col-span-2")}>
                <label className="mb-1.5 block text-xs font-medium text-gray-500" htmlFor={listId}>
                  {field.label}
                  {field.required && <span className="ml-0.5 text-red-500">*</span>}
                </label>

                {field.type === "text" && (
                  <Input
                    id={listId}
                    value={value}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    placeholder={field.placeholder || `e.g. ${field.label}`}
                    maxLength={300}
                  />
                )}

                {field.type === "number" && (
                  <Input
                    id={listId}
                    type="number"
                    value={value}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    placeholder={field.placeholder || "0"}
                  />
                )}

                {field.type === "boolean" && (
                  <div className="flex gap-2">
                    {[
                      { label: "Yes", stored: "true" },
                      { label: "No", stored: "false" },
                    ].map((option) => (
                      <button
                        key={option.stored}
                        type="button"
                        onClick={() => setValue(field.key, value === option.stored ? "" : option.stored)}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                          value === option.stored
                            ? "border-zinc-900 bg-zinc-900 text-white ring-1 ring-zinc-900"
                            : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                {field.type === "select" &&
                  (field.allowCustom ? (
                    <>
                      <Input
                        id={listId}
                        list={listId}
                        value={value}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        placeholder={field.placeholder || `Choose or type ${field.label.toLowerCase()}`}
                        maxLength={300}
                      />
                      <datalist id={listId}>
                        {field.options.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <select
                      id={listId}
                      value={value}
                      onChange={(e) => setValue(field.key, e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    >
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ))}

                {field.type === "multiselect" && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {field.options.map((option) => {
                        const selected = value
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean)
                          .includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleMulti(field.key, option)}
                            className={optionChipClass(selected)}
                          >
                            {option}
                          </button>
                        );
                      })}
                      {field.allowCustom &&
                        value
                          .split(",")
                          .map((v) => v.trim())
                          .filter((v) => v && !field.options.includes(v))
                          .map((custom) => (
                            <button
                              key={`custom-${custom}`}
                              type="button"
                              onClick={() => toggleMulti(field.key, custom)}
                              className={optionChipClass(true)}
                            >
                              {custom} ×
                            </button>
                          ))}
                    </div>
                    {field.allowCustom && (
                      <div className="flex gap-2">
                        <Input
                          id={listId}
                          placeholder={field.placeholder || `Add custom ${field.label.toLowerCase()}`}
                          maxLength={80}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            e.preventDefault();
                            const input = e.currentTarget;
                            const next = input.value.trim();
                            if (!next) return;
                            const current = value
                              .split(",")
                              .map((v) => v.trim())
                              .filter(Boolean);
                            if (!current.includes(next)) {
                              onChange({ ...values, [field.key]: [...current, next].join(", ") });
                            }
                            input.value = "";
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input =
                              e.currentTarget.parentElement?.querySelector("input");
                            const next = input?.value?.trim();
                            if (!next) return;
                            const current = value
                              .split(",")
                              .map((v) => v.trim())
                              .filter(Boolean);
                            if (!current.includes(next)) {
                              onChange({ ...values, [field.key]: [...current, next].join(", ") });
                            }
                            if (input) input.value = "";
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canAddCustom && (
        <div className="border-t border-zinc-100 pt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-500">
              Custom specifications
              <span className="ml-1 font-normal text-gray-400">(optional)</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCustomRowsChange([...customRows, { label: "", value: "" }])}
            >
              <Plus className="mr-1 h-3 w-3" /> Add Spec
            </Button>
          </div>
          {customRows.length > 0 && (
            <div className="space-y-2">
              {customRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={row.label}
                    onChange={(e) => addCustomLabel(i, e.target.value)}
                    placeholder="Label (e.g. Weight)"
                    className="w-1/3"
                    maxLength={80}
                  />
                  <Input
                    value={row.value}
                    onChange={(e) => addCustomValue(i, e.target.value)}
                    placeholder="Value (e.g. 450 g)"
                    className="flex-1"
                    maxLength={300}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onCustomRowsChange(customRows.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Add anything the category fields do not cover — shown after the structured
            specifications.
          </p>
        </div>
      )}
    </div>
  );
}

/** Stored `{key,value}` list -> editable record. */
export function specValuesToRecord(
  specValues: { key: string; value: string }[] | undefined | null
): Record<string, string> {
  const record: Record<string, string> = {};
  for (const entry of Array.isArray(specValues) ? specValues : []) {
    if (entry && typeof entry.key === "string") record[entry.key] = String(entry.value ?? "");
  }
  return record;
}
