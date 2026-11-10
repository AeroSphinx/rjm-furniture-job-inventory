"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Durations per design §6.1: 8s for undo toasts (passed per-toast via
 * `toast(..., { duration: 8000 })`), 5s otherwise (the default here).
 * Sonner's own live region announces toasts to assistive technology
 * (Requirement 17.10); nothing extra is wired on top of it.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      duration={5000}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
