"use client";

import { useEffect } from "react";

/**
 * Makes the page behave like an installed app on iPhone and iPad.
 *
 * Most of that is done in CSS and the viewport setting (see globals.css and
 * layout.tsx). This covers the one thing they can't: Safari announces a
 * two-finger pinch with its own `gesture…` events, and cancelling them stops
 * the page zooming even where Safari ignores the viewport's "no zoom" request.
 */
export function AppFeel() {
  useEffect(() => {
    const cancel = (event: Event) => event.preventDefault();
    const events = ["gesturestart", "gesturechange", "gestureend"];
    for (const name of events) {
      document.addEventListener(name, cancel, { passive: false });
    }
    return () => {
      for (const name of events) document.removeEventListener(name, cancel);
    };
  }, []);

  return null;
}
