import type { Lang } from "@/lib/i18n";

type Localized = Record<Lang, string>;

export interface Reference {
  sector: Localized;
  /** The headline number, e.g. "31 → 62%". */
  metric: string;
  metricCaption: Localized;
  problem: Localized;
  approach: Localized;
  result: Localized;
}

/**
 * Customer references shown on the home page. Add an entry only for a result
 * that was actually measured and that the customer has approved. While the
 * list is empty the section is not rendered at all.
 */
export const REFERENCES: Reference[] = [];
