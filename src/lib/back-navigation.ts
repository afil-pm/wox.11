/**
 * Tracks how deep the current browser tab is inside the App Router history so
 * back buttons can tell "this tab has a previous page to return to" apart from
 * "the current entry is the first one in the tab".
 *
 * Next.js writes the history entries itself (and even wraps
 * `history.pushState`), so the depth is maintained by wrapping those methods
 * once per document and stamping every entry with its depth. Moving with the
 * browser's own back/forward buttons restores the depth stamped on the entry
 * we land on.
 */

const DEPTH_KEY = "__woxDepth";

type HistoryMethod = (
  data: unknown,
  unused: string,
  url?: string | URL | null
) => void;

let depth = 0;
let installed = false;
let listening = false;
/** Guards against a wrapper ending up nested inside another copy of it. */
let stamping = false;

function stampedState(data: unknown): Record<string, unknown> {
  if (data !== null && typeof data === "object") {
    return { ...(data as Record<string, unknown>), [DEPTH_KEY]: depth };
  }
  return { [DEPTH_KEY]: depth, __woxCustomState: data ?? null };
}

function readDepth(): number {
  const state = window.history.state as Record<string, unknown> | null;
  const value = state?.[DEPTH_KEY];
  return typeof value === "number" ? value : 0;
}

function wrap(inner: HistoryMethod, increment: boolean): HistoryMethod {
  return (data, unused, url) => {
    if (stamping) {
      inner(data, unused, url);
      return;
    }
    stamping = true;
    if (increment) depth += 1;
    try {
      inner(stampedState(data), unused, url);
    } finally {
      stamping = false;
    }
  };
}

/**
 * Installs the history wrappers. Idempotent for the lifetime of the document
 * and safe to call before every back-button decision (it also re-syncs the
 * depth with the entry the document is currently on).
 */
export function installHistoryDepth(): void {
  if (typeof window === "undefined") return;

  // Keep the depth aligned with the entry we are currently on; entries are
  // stamped, so an unknown entry (external origin, older build) reads as 0.
  depth = readDepth();
  if (installed) return;
  installed = true;

  const { history } = window;
  const pushState = history.pushState.bind(history);
  const replaceState = history.replaceState.bind(history);
  history.pushState = wrap(pushState, true);
  history.replaceState = wrap(replaceState, false);

  if (!listening) {
    listening = true;
    window.addEventListener("popstate", () => {
      depth = readDepth();
    });
  }
}

/** True when at least one history entry exists before the current one. */
export function canGoBack(): boolean {
  if (typeof window === "undefined") return false;
  installHistoryDepth();
  return depth > 0;
}

/**
 * Walks back through the real history when this tab has a previous entry,
 * otherwise runs `fallback` (e.g. a push to the parent route) so the control
 * never dead-ends. Walking back keeps the browser Back button in sync and
 * never creates a duplicate entry.
 */
export function goBackOr(fallback: () => void): void {
  if (canGoBack()) {
    window.history.back();
    return;
  }
  fallback();
}
