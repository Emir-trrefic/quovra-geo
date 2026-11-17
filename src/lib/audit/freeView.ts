import type { AuditReport } from "./types";

/** How many of the most important issues show their fix in the free report. */
export const FREE_FIXES = 3;
/** How many extra scanned pages the free report lists. */
export const FREE_PAGES = 2;

/** IDs of the checks whose fix the free report shows: the biggest point losses first. */
export function freeFixIds(report: AuditReport): Set<string> {
  return new Set(
    report.checks
      .filter((c) => c.status !== "pass" && c.fix)
      .sort((a, b) => b.weight - b.score - (a.weight - a.score))
      .slice(0, FREE_FIXES)
      .map((c) => c.id),
  );
}

/**
 * The free version of a report: every score and finding stays, but only the top fixes, the first
 * scanned pages and the robots.txt suggestion are kept. Used for the on-screen report and its
 * Markdown/PDF exports. The open-source CLI and API still return the full report.
 */
export function toFreeView(report: AuditReport): AuditReport {
  const open = freeFixIds(report);
  return {
    ...report,
    checks: report.checks.map((c) => (open.has(c.id) || c.status === "pass" ? c : { ...c, fix: "" })),
    pages: report.pages?.slice(0, FREE_PAGES),
    generated: { ...report.generated, llmsTxt: "", jsonLd: "" },
  };
}
