import { connectMongoDB } from "@/lib/mongodb";
import SpecTemplate, { ISpecTemplate } from "@/lib/models/spec-template";
import { DEFAULT_SPEC_TEMPLATES, defaultTemplateFor } from "./defaults";
import type { SpecField, SpecTemplate as SpecTemplateShape } from "./types";

function fromDoc(doc: ISpecTemplate): SpecTemplateShape {
  return {
    id: String(doc._id),
    categoryType: doc.categoryType,
    name: doc.name,
    fields: (doc.fields ?? []).map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      options: [...(f.options ?? [])],
      allowCustom: !!f.allowCustom,
      required: !!f.required,
      placeholder: f.placeholder ?? "",
    })),
  };
}

function cloneDefault(template: SpecTemplateShape): SpecTemplateShape {
  return {
    ...template,
    fields: template.fields.map((f: SpecField) => ({ ...f, options: [...f.options] })),
  };
}

/**
 * Every template the app knows about: whatever the admin saved wins, the
 * built-in presets fill in the category types nobody has configured yet, and a
 * failed database read degrades to the presets instead of an empty panel.
 */
export async function loadSpecTemplates(): Promise<SpecTemplateShape[]> {
  let stored: SpecTemplateShape[] = [];
  try {
    await connectMongoDB();
    const docs = await SpecTemplate.find().sort({ name: 1 }).lean();
    stored = (docs as unknown as ISpecTemplate[]).map(fromDoc);
  } catch (error) {
    console.error("[SPEC_TEMPLATES] failed to load stored templates:", error);
  }

  const known = new Set(stored.map((t) => t.categoryType));
  const fallbacks = DEFAULT_SPEC_TEMPLATES.filter((t) => !known.has(t.categoryType)).map(cloneDefault);

  return [...stored, ...fallbacks].sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadSpecTemplate(categoryType: string): Promise<SpecTemplateShape | null> {
  const key = categoryType.trim().toLowerCase();
  if (!key) return null;

  try {
    await connectMongoDB();
    const doc = await SpecTemplate.findOne({ categoryType: key }).lean();
    if (doc) return fromDoc(doc as unknown as ISpecTemplate);
  } catch (error) {
    console.error("[SPEC_TEMPLATES] failed to load template:", error);
  }

  const fallback = defaultTemplateFor(key);
  return fallback ? cloneDefault(fallback) : null;
}
