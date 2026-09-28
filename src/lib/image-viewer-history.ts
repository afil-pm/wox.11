/**
 * History bookkeeping for the fullscreen product image viewer.
 *
 * On mobile the system Back button must close the viewer first instead of
 * leaving the product page. Opening the viewer therefore pushes exactly one
 * history entry; the Back button pops it (which only closes the viewer), and
 * closing the viewer with X / Escape pops it afterwards.
 *
 * Everything is injected so the behaviour can be verified without a browser.
 */

/** History entry marker. Existing state (router state) is spread, not replaced. */
export const IMAGE_VIEWER_HISTORY_KEY = "woxImageZoom";

export interface ViewerHistoryDeps {
  /** `window.history.state` of the current entry. */
  getState: () => Record<string, unknown> | null;
  /** Pushes one entry, keeping any existing state. */
  pushState: (state: Record<string, unknown>) => void;
  /** Leaves the current entry, exactly like the system Back button. */
  back: () => void;
  /** Registers a `popstate` listener; returns the unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
}

export interface ViewerHistoryHandle {
  /** Call when the viewer closes for any other reason (X, Escape, unmount). */
  release: () => void;
}

export interface ImageViewerHistoryController {
  /**
   * Pushes the viewer's history entry and closes the viewer when the system
   * Back button pops it. A released handle drops the entry again, unless the
   * Back button already did or a newer mount took over (React StrictMode
   * re-runs effects on mount, which must not pop the entry twice).
   */
  open(deps: ViewerHistoryDeps, onClose: () => void): ViewerHistoryHandle;
}

export function createImageViewerHistoryController(): ImageViewerHistoryController {
  let generation = 0;

  return {
    open(deps, onClose) {
      let consumedByBack = false;
      const myGeneration = ++generation;

      const currentState = deps.getState() || {};
      if (!currentState[IMAGE_VIEWER_HISTORY_KEY]) {
        deps.pushState({ ...currentState, [IMAGE_VIEWER_HISTORY_KEY]: true });
      }

      const handlePopState = () => {
        // The Back button already left our entry: closing is all that is left.
        consumedByBack = true;
        onClose();
      };
      const unsubscribe = deps.subscribe(handlePopState);

      return {
        release() {
          unsubscribe();
          queueMicrotask(() => {
            if (consumedByBack) return; // already backed out of the entry
            if (myGeneration !== generation) return; // a newer mount owns it
            deps.back();
          });
        },
      };
    },
  };
}
