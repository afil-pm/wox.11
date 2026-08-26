"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  label: string;
  value: string;
}

interface PremiumSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export default function PremiumSelect({ value, onValueChange, options, placeholder = "Select...", className }: PremiumSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-all",
          open ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200 hover:border-zinc-300"
        )}
      >
        <span className={selected ? "text-zinc-900" : "text-zinc-400"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onValueChange(option.value); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors",
                  value === option.value ? "bg-zinc-50 text-zinc-900 font-medium" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <span className="flex-1 text-left">{option.label}</span>
                {value === option.value && <Check className="h-4 w-4 text-zinc-900" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
