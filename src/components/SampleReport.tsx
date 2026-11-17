import type { Category } from "@/lib/audit/types";
import type { Lang } from "@/lib/i18n";
import { LANDING } from "@/lib/i18n/landing";
import { UI } from "@/lib/i18n/ui";

// Points earned per category for the fictional site; they add up to the 74 shown as the score.
const EARNED: [Category, number, number][] = [
  ["access", 16.5, 30],
  ["structure", 27, 29],
  ["content", 17, 22],
  ["trust", 5, 7],
  ["technical", 6, 6],
  ["agent", 2, 6],
];

/** A static, clearly-labelled report excerpt shown until the visitor runs their own audit. */
export function SampleReport({ lang }: { lang: Lang }) {
  const t = LANDING[lang].sample;
  const r = UI[lang].report;
  const num = new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-US");
  return (
    <div className="panel" data-reveal role="group" aria-label={`${t.label}: ${t.site}`}>
      <div className="panel-head">
        <div><strong>{t.site}</strong><span className="sep">/</span>{t.report}</div>
        <div className="tags">
          <span className="tag"><span className="dot" aria-hidden />{t.label}</span>
          <span className="tag">{t.scope}</span>
        </div>
      </div>

      <div className="panel-metrics">
        {t.metrics.map(([label, value, unit, note]) => (
          <div className="metric" key={label}>
            <div className="k">{label}</div>
            <div className="v"><span {...(/^%?\d+%?$/.test(value) ? { "data-count": "" } : {})}>{value}</span>{unit && <small>{unit}</small>}</div>
            <div className="d">{note}</div>
          </div>
        ))}
      </div>

      <div className="panel-body">
        <div className="chart-box">
          <div className="box-title"><strong>{t.chartTitle}</strong><span>{t.chartUnit}</span></div>
          <div className="hbars">
            {EARNED.map(([cat, got, max]) => (
              <div className="hbar" key={cat}>
                <span>{r.categories[cat]}</span>
                <div className="hbar-track" aria-hidden><i style={{ "--w": got / max } as React.CSSProperties} /></div>
                <b>{num.format(got)}/{max}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="table-box">
          <div className="box-title"><strong>{t.tableTitle}</strong><span>{t.tableCount}</span></div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>{t.cols.map((c, i) => <th key={c} className={i === 2 ? "num" : undefined}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {t.rows.map(([title, cat, points, status]) => (
                  <tr key={title}>
                    <td>{title}</td>
                    <td className="dim">{r.categories[cat]}</td>
                    <td className="num mono">{points}</td>
                    <td><span className="status"><span className={`dot ${status}`} aria-hidden />{r.status[status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="panel-note">{t.note}</p>
    </div>
  );
}
