"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  ListTree,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { SPEC_FIELD_TYPES, type SpecField, type SpecFieldType, type SpecTemplate } from "@/lib/specs/types";

const TYPE_LABELS: Record<SpecFieldType, string> = {
  text: "Text",
  select: "Dropdown",
  multiselect: "Multi-select",
  number: "Number",
  boolean: "Yes / No",
};

const TYPE_HINTS: Record<SpecFieldType, string> = {
  text: "Free text, e.g. Country of Origin",
  select: "One option from the list, plus an optional custom value",
  multiselect: "Several options at once, e.g. Care Instructions",
  number: "Numeric value, e.g. Pockets",
  boolean: "A simple Yes or No answer",
};

function emptyField(): SpecField {
  return {
    key: "",
    label: "",
    type: "text",
    options: [],
    allowCustom: false,
    required: false,
    supplierEditable: true,
    placeholder: "",
  };
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-zinc-300"
      />
      <span>
        <span className="font-medium text-zinc-700">{label}</span>
        {hint && <span className="block text-zinc-400">{hint}</span>}
      </span>
    </label>
  );
}

function OptionsEditor({
  field,
  onChange,
}: {
  field: SpecField;
  onChange: (patch: Partial<SpecField>) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim().replace(/,+$/, "");
    if (!value) return;
    if (!field.options.includes(value)) {
      onChange({ options: [...field.options, value] });
    }
    setDraft("");
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        Options
      </p>
      {field.options.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {field.options.map((option, index) => (
            <span
              key={`${option}-${index}`}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-700"
            >
              {option}
              <button
                type="button"
                onClick={() => onChange({ options: field.options.filter((_, i) => i !== index) })}
                className="text-zinc-400 hover:text-red-500"
                aria-label={`Remove ${option}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder="Type an option, press Enter"
          className="h-8"
          maxLength={80}
        />
        <Button type="button" variant="outline" size="sm" onClick={commit}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <p className="mt-1.5 text-[11px] text-zinc-400">
        Shown to {""}
        admin and supplier forms. Values outside this list are rejected unless
        “accept custom values” is on.
      </p>
    </div>
  );
}

export default function AdminSpecificationsPage() {
  const [templates, setTemplates] = useState<SpecTemplate[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [editing, setEditing] = useState<SpecTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; message: string } | null>(null);
  const [newType, setNewType] = useState("");

  async function loadTemplates(select?: string) {
    try {
      const res = await adminFetch("/api/wox/admin/spec-templates");
      const data = await res.json();
      const list: SpecTemplate[] = Array.isArray(data.templates) ? data.templates : [];
      setTemplates(list);
      const target = select && list.some((t) => t.categoryType === select)
        ? select
        : list.some((t) => t.categoryType === selectedType)
          ? selectedType
          : (list[0]?.categoryType ?? "");
      setSelectedType(target);
    } catch {
      setStatus({ kind: "err", message: "Failed to load specification templates" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const template = templates.find((t) => t.categoryType === selectedType);
    setEditing(template ? JSON.parse(JSON.stringify(template)) : null);
    setStatus(null);
  }, [selectedType, templates]);

  function updateEditing(next: SpecTemplate) {
    setEditing(next);
  }

  function updateField(index: number, patch: Partial<SpecField>) {
    if (!editing) return;
    updateEditing({
      ...editing,
      fields: editing.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    });
  }

  function moveField(index: number, direction: -1 | 1) {
    if (!editing) return;
    const target = index + direction;
    if (target < 0 || target >= editing.fields.length) return;
    const fields = [...editing.fields];
    [fields[index], fields[target]] = [fields[target], fields[index]];
    updateEditing({ ...editing, fields });
  }

  function removeField(index: number) {
    if (!editing) return;
    updateEditing({ ...editing, fields: editing.fields.filter((_, i) => i !== index) });
  }

  function addField() {
    if (!editing) return;
    if (editing.fields.length >= 60) return;
    updateEditing({ ...editing, fields: [...editing.fields, emptyField()] });
  }

  function startNewType() {
    const type = newType.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!type) return;
    if (templates.some((t) => t.categoryType === type)) {
      setSelectedType(type);
      setNewType("");
      return;
    }
    const fresh: SpecTemplate = {
      id: "",
      categoryType: type,
      name: newType.trim(),
      allowSupplierCustom: true,
      fields: [emptyField()],
    };
    setTemplates((prev) => [...prev, fresh]);
    setSelectedType(type);
    setNewType("");
  }

  async function handleSave() {
    if (!editing) return;
    setStatus(null);

    const labelled = editing.fields.filter((f) => f.label.trim());
    if (labelled.length !== editing.fields.length) {
      setStatus({ kind: "err", message: "Every field needs a label before saving." });
      return;
    }

    setSaving(true);
    try {
      const res = await adminFetch("/api/wox/admin/spec-templates", {
        method: "PUT",
        body: JSON.stringify({ template: editing }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ kind: "err", message: data.error || "Failed to save template" });
        return;
      }
      setStatus({ kind: "ok", message: "Template saved — product forms update immediately." });
      await loadTemplates(editing.categoryType);
    } catch {
      setStatus({ kind: "err", message: "Failed to save template" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Product Specifications</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Define which specification fields each category exposes on the product forms and
          product pages. Suppliers only see the fields you mark as editable.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Category types */}
        <aside className="space-y-3">
          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <ListTree className="h-3.5 w-3.5" /> Category types
            </p>
            <div className="space-y-1">
              {templates.map((template) => (
                <button
                  key={template.categoryType}
                  type="button"
                  onClick={() => setSelectedType(template.categoryType)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    selectedType === template.categoryType
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
                  )}
                >
                  <span className="truncate">{template.name}</span>
                  <span
                    className={cn(
                      "ml-2 text-[11px]",
                      selectedType === template.categoryType ? "text-zinc-400" : "text-zinc-400"
                    )}
                  >
                    {template.fields.length}
                  </span>
                </button>
              ))}
              {templates.length === 0 && !loading && (
                <p className="px-1 py-2 text-xs text-zinc-400">No templates loaded.</p>
              )}
            </div>
            <div className="mt-3 border-t border-zinc-100 pt-3">
              <div className="flex gap-1.5">
                <Input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startNewType()}
                  placeholder="New category type"
                  className="h-8"
                />
                <Button type="button" variant="outline" size="sm" onClick={startNewType}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-400">
                Presets exist for Pants, Shirts, T-Shirts and Shoes.
              </p>
            </div>
          </div>
        </aside>

        {/* Editor */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          {!editing ? (
            <p className="py-10 text-center text-sm text-zinc-400">
              {loading ? "Loading templates…" : "Select a category type to edit its fields."}
            </p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Name</label>
                  <Input
                    value={editing.name}
                    onChange={(e) => updateEditing({ ...editing, name: e.target.value })}
                    placeholder="Template name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                    Category type (key)
                  </label>
                  <Input value={editing.categoryType} readOnly className="bg-zinc-50" />
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <Toggle
                  checked={editing.allowSupplierCustom}
                  onChange={(allowSupplierCustom) => updateEditing({ ...editing, allowSupplierCustom })}
                  label="Suppliers may add their own custom specification rows"
                  hint="Off = only the fields below can carry supplier values."
                />
              </div>

              <div className="space-y-3">
                {editing.fields.map((field, index) => {
                  const hasOptions = field.type === "select" || field.type === "multiselect";
                  return (
                    <div
                      key={`${field.key || "new"}-${index}`}
                      className={cn(
                        "rounded-xl border p-4 transition-colors",
                        field.label.trim() ? "border-zinc-200" : "border-amber-300 bg-amber-50/40"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Field label (e.g. Fabric)"
                          className="h-9 min-w-40 flex-1"
                          maxLength={80}
                        />
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(index, { type: e.target.value as SpecFieldType })
                          }
                          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900"
                        >
                          {SPEC_FIELD_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {TYPE_LABELS[type]}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveField(index, -1)}
                            disabled={index === 0}
                            aria-label="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveField(index, 1)}
                            disabled={index === editing.fields.length - 1}
                            aria-label="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(index)}
                            className="text-red-500 hover:text-red-600"
                            aria-label="Delete field"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-400">
                        <Info className="h-3 w-3" />
                        {TYPE_HINTS[field.type]}
                        {!field.label.trim() && (
                          <span className="text-amber-600"> · label required to save</span>
                        )}
                      </p>

                      {hasOptions && (
                        <div className="mt-3">
                          <OptionsEditor field={field} onChange={(patch) => updateField(index, patch)} />
                          <div className="mt-2">
                            <Toggle
                              checked={field.allowCustom}
                              onChange={(allowCustom) => updateField(index, { allowCustom })}
                              label="Accept custom values"
                              hint="Users can type a value that is not in the options list."
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-zinc-100 pt-3 sm:grid-cols-3">
                        <Toggle
                          checked={field.required}
                          onChange={(required) => updateField(index, { required })}
                          label="Required"
                          hint="Must be filled before saving a product."
                        />
                        <Toggle
                          checked={field.supplierEditable}
                          onChange={(supplierEditable) => updateField(index, { supplierEditable })}
                          label="Suppliers can edit"
                          hint="Off = only admins set this value."
                        />
                        {(field.type === "text" || field.type === "number") && (
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-zinc-500">
                              Placeholder
                            </label>
                            <Input
                              value={field.placeholder}
                              onChange={(e) => updateField(index, { placeholder: e.target.value })}
                              placeholder="e.g. e.g. India"
                              className="h-8 text-xs"
                              maxLength={120}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Field
                </Button>
                <div className="flex items-center gap-3">
                  {status && (
                    <p
                      className={cn(
                        "text-xs",
                        status.kind === "ok" ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {status.message}
                    </p>
                  )}
                  <Button type="button" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" /> Save Template
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
