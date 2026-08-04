"use client";

import { useEffect } from "react";

/**
 * Returns true when the element is a place the user might be typing, so we leave
 * it alone (buttons, checkboxes, and the like are not text entry).
 */
function isEditable(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type;
    return ![
      "button",
      "checkbox",
      "radio",
      "submit",
      "reset",
      "file",
      "range",
      "color",
    ].includes(type);
  }
  return (el as HTMLElement).isContentEditable === true;
}

/**
 * Listens for a hardware barcode scanner (HID keyboard mode) globally, so staff
 * do not have to click Scan Card first.
 *
 * A scanner types a whole code in a few milliseconds and ends with Enter, far
 * faster than a human. We only treat input as a scan when the keys arrive that
 * fast and end with Enter. To avoid interfering with normal typing, we ignore
 * everything while a text field is focused; in that case the field (or the Scan
 * button) handles the scan instead.
 */
export function useGlobalScanner(onScan: (code: string) => void) {
  useEffect(() => {
    let buffer = "";
    let lastTime = 0;
    const RESET_GAP_MS = 60; // scanners are far faster than this between keys
    const MIN_LENGTH = 3;

    function handler(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      // Do not interfere with someone typing into a field.
      if (isEditable(document.activeElement)) return;

      const now = performance.now();

      if (event.key === "Enter") {
        if (buffer.length >= MIN_LENGTH) {
          const code = buffer;
          buffer = "";
          event.preventDefault();
          onScan(code);
        } else {
          buffer = "";
        }
        return;
      }

      if (event.key.length === 1) {
        // A slow gap means this is not a scanner burst; start fresh.
        if (now - lastTime > RESET_GAP_MS) buffer = "";
        buffer += event.key;
        lastTime = now;
      }
    }

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onScan]);
}
