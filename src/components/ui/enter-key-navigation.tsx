"use client";

import { useEffect } from "react";

const BLOCKING_TYPES = new Set([
  "hidden",
  "button",
  "submit",
  "reset",
  "image",
  "file",
  "checkbox",
  "radio",
]);

const TEXT_TYPES = new Set([
  "text",
  "email",
  "password",
  "number",
  "tel",
  "search",
  "url",
  "date",
  "time",
  "month",
  "week",
  "datetime-local",
]);

type FieldNode = {
  tagName?: string;
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  dataset?: { enterNav?: string };
  getAttribute?: (name: string) => string | null;
  focus?: () => void;
  select?: () => void;
};

type FormNode = {
  querySelectorAll?: (selectors: string) => ArrayLike<FieldNode>;
  requestSubmit?: () => void;
  dispatchEvent?: (event: Event) => boolean;
};

function tagNameOf(node: unknown): string {
  const tag = (node as FieldNode | null)?.tagName;
  return tag ? String(tag).toUpperCase() : "";
}

function hasOwnNavOff(node: FieldNode): boolean {
  if (node.dataset?.enterNav === "off") return true;
  if (node.getAttribute && node.getAttribute("data-enter-nav") === "off") return true;
  return false;
}

/** A field Enter can move to: enabled, visible, not opted out. */
export function isSelectableField(el: FieldNode | null): boolean {
  if (!el) return false;
  const tag = tagNameOf(el);

  if (tag === "INPUT") {
    if (BLOCKING_TYPES.has((el.type || "text").toLowerCase())) return false;
    if (el.disabled || el.readOnly) return false;
  } else if (tag === "TEXTAREA") {
    if (el.disabled || el.readOnly) return false;
  } else if (tag === "SELECT") {
    if (el.disabled) return false;
  } else {
    return false;
  }

  if (el.hidden) return false;
  if (el.getAttribute && el.getAttribute("aria-hidden") === "true") return false;
  if (hasOwnNavOff(el)) return false;
  return true;
}

function isTextField(el: FieldNode | null): boolean {
  if (!el || tagNameOf(el) !== "INPUT") return false;
  return TEXT_TYPES.has((el.type || "text").toLowerCase());
}

/**
 * Enter inside a form field moves focus to the next field, and only the last
 * field submits — through the normal submission path, so browser validation
 * and existing onSubmit handlers keep working. Textareas keep their newline
 * behaviour and any handler that already called preventDefault() wins.
 */
export function handleEnterKeyDown(e: KeyboardEvent): void {
  if (e.key !== "Enter") return;
  if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.defaultPrevented || e.isComposing) return;

  const target = e.target as FieldNode | null;
  if (!isTextField(target)) return;
  if (hasOwnNavOff(target as FieldNode)) return;

  const form = (target as FieldNode & { form?: FormNode | null }).form;
  if (!form || typeof form.querySelectorAll !== "function") return;

  const fields = Array.from(form.querySelectorAll("input, select, textarea")).filter((f) =>
    isSelectableField(f)
  );
  const index = fields.indexOf(target as FieldNode);
  if (index === -1) return;

  const next = fields[index + 1];
  if (next) {
    e.preventDefault();
    next.focus?.();
    if (isTextField(next)) next.select?.();
    return;
  }

  // Last field: submit through the browser's normal submission path.
  e.preventDefault();
  if (typeof form.requestSubmit === "function") {
    form.requestSubmit();
  } else if (typeof form.dispatchEvent === "function") {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  }
}

/** Mounted once from the root layout so every screen behaves the same way. */
export default function EnterKeyNavigation() {
  useEffect(() => {
    // Bubble phase so component level handlers run first: anything that calls
    // preventDefault() (custom Enter behaviour) keeps priority.
    document.addEventListener("keydown", handleEnterKeyDown);
    return () => document.removeEventListener("keydown", handleEnterKeyDown);
  }, []);

  return null;
}
