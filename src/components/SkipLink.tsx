/**
 * Accessibility: skip-to-content link, visible only on keyboard focus.
 * Section 14 of Frontend Change Requirements.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-1.5 focus:rounded-md focus:text-sm focus:font-medium focus:shadow-md"
    >
      Skip to main content
    </a>
  );
}
