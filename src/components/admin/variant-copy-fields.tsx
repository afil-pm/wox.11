"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type VariantSpecification = { label: string; value: string };

export type VariantCopy = {
  title: string;
  description: string;
  specifications: VariantSpecification[];
};

/**
 * Editor for the copy a single colour owns. Every field is optional: an empty
 * value means the customer sees the product level title/description/specs, so
 * products that never use this stay exactly as they are.
 */
export default function VariantCopyFields({
  value,
  onChange,
  productName,
}: {
  value: VariantCopy;
  onChange: (next: VariantCopy) => void;
  productName?: string;
}) {
  const titlePlaceholder = productName
    ? `e.g. ${productName} – Blue`
    : "e.g. Product A – Blue";

  return (
    <div className="mt-3 space-y-3 border-t border-zinc-100 pt-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Title for this colour
          <span className="ml-1 font-normal text-gray-400">(optional)</span>
        </label>
        <Input
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder={titlePlaceholder}
          maxLength={160}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Description for this colour
          <span className="ml-1 font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder="Shown when this colour is selected on the product page"
          rows={3}
          maxLength={4000}
          className="flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-500">
            Specifications for this colour
            <span className="ml-1 font-normal text-gray-400">(optional)</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...value,
                specifications: [...value.specifications, { label: "", value: "" }],
              })
            }
          >
            <Plus className="mr-1 h-3 w-3" /> Add Spec
          </Button>
        </div>
        {value.specifications.length > 0 && (
          <div className="space-y-2">
            {value.specifications.map((spec, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={spec.label}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      specifications: value.specifications.map((s, j) =>
                        j === i ? { ...s, label: e.target.value } : s
                      ),
                    })
                  }
                  placeholder="Label (e.g. Material)"
                  className="w-1/3"
                />
                <Input
                  value={spec.value}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      specifications: value.specifications.map((s, j) =>
                        j === i ? { ...s, value: e.target.value } : s
                      ),
                    })
                  }
                  placeholder="Value (e.g. 100% Cotton)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onChange({
                      ...value,
                      specifications: value.specifications.filter((_, j) => j !== i),
                    })
                  }
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-400">
          Leave everything empty to keep using the product&apos;s own title, description and
          specifications for this colour.
        </p>
      </div>
    </div>
  );
}
