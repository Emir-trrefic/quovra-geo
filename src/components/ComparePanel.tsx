"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/lib/audit/types";
import type { CompareReport, SiteEntry } from "@/lib/compare";
import type { Lang } from "@/lib/i18n";
import { UI } from "@/lib/i18n/ui";
import { href } from "@/lib/routes";
import { Icon } from "./Icon";

/** How many gaps show their fix in the free comparison, matching the free audit report. */
const FREE_GAP_FIXES = 3;

export interface Suggested {
  name: string;
  url: string;
}

export function ComparePanel({ lang, url, suggested }: { lang: Lang; url: string; suggested?: Suggested[] }) {
  const t = UI[lang].compare;
  const r = UI[lang].report;
  const [sites, setSites] = useState<Suggested[]>(() => fill(suggested));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CompareReport | null>(null);

  // Competitors handed over from the mention probe replace whatever was typed.
  useEffect(() => {
    if (suggested?.length) setSites(fill(suggested));
  }, [suggested]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, lang, competitors: sites.filter((s) => s.url.trim()).map((s) => ({ url: s.url, name: s.name || undefined })) }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error);
      else setReport(data);
    } catch {
      setError(UI[lang].audit.network);
    } finally {
      setLoading(false);
    }
  }

  const cats = Object.keys(r.categories) as Category[];
  const pct = (e: SiteEntry, c: Category) => {
    const v = e.categories?.[c];
    return v && v.max ? Math.round((v.score / v.max) * 100) : 0;
  };

  return (
    <div className="card compare">
      <form onSubmit={run}>
        <h3>{t.title}</h3>
        <p>{t.lead}</p>
        <div className="compare-inputs">
          {sites.map((s, i) => (
            <input
              key={i}
              className="field"
              aria-label={`${t.site} ${i + 1}`}
              placeholder={t.placeholder(i + 1)}
              value={s.url}
              onChange={(e) => setSites(sites.map((x, j) => (j === i ? { name: "", url: e.target.value } : x)))}
            />
          ))}
        </div>
        <p style={{ marginTop: 12 }}>
          <button className="btn" disabled={loading || !sites.some((s) => s.url.trim())}>{loading ? t.running : t.run}</button>
        </p>
      </form>
      {error && <p className="error">{error}</p>}

      {report && (
        <div className="compare-result">
          <p className="compare-rank">
            <strong>{t.rank(report.rank, report.ranked)}</strong>
            {report.competitorAvg !== null && <span className="muted"> · {t.avg(report.competitorAvg)}</span>}
          </p>

          <div className="table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>{t.site}</th>
                  <th>{t.score}</th>
                  {cats.map((c) => <th key={c}>{r.categories[c]}</th>)}
                </tr>
              </thead>
              <tbody>
                {[report.you, ...report.competitors].map((e, i) => (
                  <tr key={e.url} className={i === 0 ? "is-you" : undefined}>
                    <td className="url-cell">{e.name}{i === 0 && <span className="muted"> ({t.you})</span>}</td>
                    {e.ok ? (
                      <>
                        <td><span className={`pill ${gradeClass(e.score!)}`}>{e.score} · {e.grade}</span></td>
                        {cats.map((c) => <td key={c} className={cellClass(pct(e, c), report, c, i)}>{pct(e, c)}%</td>)}
                      </>
                    ) : (
                      <td colSpan={cats.length + 1} className="muted">{t.unreachable}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="compare-h">{t.gapsTitle}</h4>
          {report.gaps.length === 0 ? (
            <p className="muted">{t.gapsNone}</p>
          ) : (
            <div className="list">
              {report.gaps.map((g, i) => (
                <div className="check" key={g.id}>
                  <span className={`pill ${g.you === 0 ? "fail" : "warn"}`}>−{round(g.best - g.you)}</span>
                  <div>
                    <h4>{g.title}</h4>
                    <p>{t.gapLine(g.you, g.best, g.weight)}</p>
                    <p className="muted small">{t.ahead} {g.ahead.join(", ")}</p>
                    {g.fix && i < FREE_GAP_FIXES ? (
                      <p className="fix"><strong>{r.fix} →</strong> {g.fix}</p>
                    ) : g.fix ? (
                      <p className="fix locked"><Icon name="lock" size={14} /> {r.lock.fix} <a href={href("pricing", lang)}>{r.lock.seePlans}</a></p>
                    ) : null}
                  </div>
                  <span />
                </div>
              ))}
            </div>
          )}

          {report.strengths.length > 0 && (
            <>
              <h4 className="compare-h">{t.strengthsTitle}</h4>
              <ul className="compare-strengths">
                {report.strengths.map((s) => <li key={s.id}>{s.title}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function fill(list?: Suggested[]): Suggested[] {
  const out = (list ?? []).slice(0, 3);
  while (out.length < 3) out.push({ name: "", url: "" });
  return out;
}

const round = (n: number) => Math.round(n * 10) / 10;

function gradeClass(score: number) {
  return score >= 70 ? "pass" : score >= 45 ? "warn" : "fail";
}

/** Highlights your category cells red when the best competitor is clearly ahead there. */
function cellClass(value: number, report: CompareReport, cat: Category, row: number): string | undefined {
  if (row !== 0) return undefined;
  const best = Math.max(0, ...report.competitors.filter((c) => c.ok).map((c) => {
    const v = c.categories?.[cat];
    return v && v.max ? Math.round((v.score / v.max) * 100) : 0;
  }));
  return best - value >= 15 ? "behind" : value - best >= 15 ? "ahead" : undefined;
}
