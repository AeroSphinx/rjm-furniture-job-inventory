/**
 * The first focusable element on every page (Requirement 6.12). Visually
 * hidden until focused, then it becomes a normal visible link so a
 * keyboard user always sees where focus landed.
 */
function SkipLink({ label = "Skip to main content" }: { label?: string }) {
  return (
    <a
      href="#main"
      className={[
        "sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100]",
        "focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium",
        "focus:text-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring",
      ].join(" ")}
    >
      {label}
    </a>
  );
}

export { SkipLink };
