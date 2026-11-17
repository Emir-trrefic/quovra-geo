import { type AuditOptions, normalizeUrl, runAudit } from "../audit";
import { sameSite } from "../audit/checks";
import type { AuditReport, Category, Grade, Status } from "../audit/types";
import type { Lang } from "../i18n";

/**
 * Competitor comparison: audits your site next to the sites AI assistants recommend instead of you,
 * and turns the difference into a ranked list of gaps ("they all have FAQ markup, you do not").
 *
 * The audit says what is wrong in absolute terms. The comparison says what is wrong relative to the
 * businesses that are actually winning the answer, which is what decides who gets recommended.
 */

export const MAX_COMPETITORS = 3;

export interface CompetitorInput {
  /** Display name, e.g. from the mention probe. Defaults to the host name. */
  name?: string;
  url: string;
}

export interface SiteEntry {
  name: string;
  url: string;
  /** False when the site could not be audited; `error` says why and the scores are absent. */
  ok: boolean;
  error?: string;
  score?: number;
  grade?: Grade;
  categories?: Record<Category, { score: number; max: number }>;
  checks?: Record<string, { status: Status; score: number; weight: number }>;
}

export interface Gap {
  id: string;
  title: string;
  category: Category;
  weight: number;
  /** Your points on this check. */
  you: number;
  /** Best competitor points on this check. */
  best: number;
  /** Names of the competitors that score higher than you here. */
  ahead: string[];
  /** Points behind the best competitor, weighted by how many competitors are ahead. Used for ranking. */
  impact: number;
  fix?: string;
}

export interface Strength {
  id: string;
  title: string;
  you: number;
  weight: number;
}

export interface CompareReport {
  lang: Lang;
  you: SiteEntry;
  competitors: SiteEntry[];
  /** Your position by overall score among every site that could be audited (1 = best). */
  rank: number;
  /** Sites that could be audited, you included. */
  ranked: number;
  /** Average score of the competitors that could be audited. */
  competitorAvg: number | null;
  gaps: Gap[];
  strengths: Strength[];
}

type Audit = (url: string, opts: AuditOptions) => Promise<AuditReport>;

function entry(name: string, report: AuditReport): SiteEntry {
  return {
    name,
    url: report.finalUrl,
    ok: true,
    score: report.score,
    grade: report.grade,
    categories: report.categories,
    checks: Object.fromEntries(report.checks.map((c) => [c.id, { status: c.status, score: c.score, weight: c.weight }])),
  };
}

/**
 * Pure comparison of audit reports, separated from fetching so it can be unit tested.
 * Competitors that failed to load appear in the list but do not affect gaps, rank or averages.
 */
export function buildComparison(
  you: AuditReport,
  others: { name: string; url: string; report?: AuditReport; error?: string }[],
  lang: Lang = you.lang,
): CompareReport {
  const own = entry(new URL(you.finalUrl).hostname.replace(/^www\./, ""), you);
  const competitors: SiteEntry[] = others.map((o) =>
    o.report ? entry(o.name, o.report) : { name: o.name, url: o.url, ok: false, error: o.error ?? "unreachable" });
  const audited = competitors.filter((c) => c.ok);

  const gaps: Gap[] = [];
  const strengths: Strength[] = [];
  for (const check of you.checks) {
    const scores = audited.map((c) => ({ name: c.name, score: c.checks?.[check.id]?.score ?? 0 }));
    if (scores.length === 0) continue;
    const ahead = scores.filter((s) => s.score > check.score + 0.05);
    const best = Math.max(...scores.map((s) => s.score));
    const behind = best - check.score;
    // A gap needs someone to be clearly better: at least 15% of the check's points, or a full pass you lack.
    const leaderPasses = audited.some((c) => c.checks?.[check.id]?.status === "pass");
    if (ahead.length > 0 && (behind >= check.weight * 0.15 || (leaderPasses && check.status !== "pass"))) {
      gaps.push({
        id: check.id, title: check.title, category: check.category, weight: check.weight,
        you: check.score, best,
        ahead: ahead.sort((a, b) => b.score - a.score).map((s) => s.name),
        impact: Math.round(behind * (ahead.length / scores.length) * 100) / 100,
        fix: check.fix,
      });
    } else if (check.status === "pass" && check.weight >= 2 && scores.every((s) => s.score < check.score - 0.05)) {
      strengths.push({ id: check.id, title: check.title, you: check.score, weight: check.weight });
    }
  }
  gaps.sort((a, b) => b.impact - a.impact || b.weight - a.weight);
  strengths.sort((a, b) => b.weight - a.weight);

  const scores = audited.map((c) => c.score!);
  return {
    lang,
    you: own,
    competitors,
    rank: 1 + scores.filter((s) => s > you.score).length,
    ranked: 1 + scores.length,
    competitorAvg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    gaps,
    strengths,
  };
}

/** Cleans the competitor list: valid public URLs only, not your own site, no duplicates, at most three. */
export function prepareCompetitors(ownUrl: string, input: CompetitorInput[]): { name: string; url: string }[] {
  const ownHost = normalizeUrl(ownUrl).hostname;
  const seen = new Set<string>();
  const out: { name: string; url: string }[] = [];
  for (const c of input) {
    if (out.length >= MAX_COMPETITORS) break;
    let url: URL;
    try {
      url = normalizeUrl(c.url);
    } catch {
      continue;
    }
    const host = url.hostname.replace(/^www\./, "");
    if (sameSite(host, ownHost) || seen.has(host)) continue;
    seen.add(host);
    out.push({ name: c.name?.trim().slice(0, 80) || host, url: url.toString() });
  }
  return out;
}

/** Audits your site and up to three competitors in parallel, then compares them. */
export async function compareSites(
  ownUrl: string,
  competitors: CompetitorInput[],
  opts: AuditOptions & { audit?: Audit } = {},
): Promise<CompareReport> {
  const audit = opts.audit ?? runAudit;
  const list = prepareCompetitors(ownUrl, competitors);
  if (list.length === 0) throw new Error("Add at least one competitor website that is not your own.");
  const auditOpts: AuditOptions = { ...opts, maxPages: 1 };
  const [you, ...others] = await Promise.all([
    audit(ownUrl, auditOpts),
    ...list.map((c) => audit(c.url, auditOpts).then(
      (report) => ({ ...c, report }),
      (err: unknown) => ({ ...c, error: err instanceof Error && err.name === "TimeoutError" ? "timeout" : "unreachable" }),
    )),
  ]) as [AuditReport, ...{ name: string; url: string; report?: AuditReport; error?: string }[]];
  return buildComparison(you, others, opts.lang ?? you.lang);
}
