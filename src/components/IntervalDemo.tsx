"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { LANDING } from "@/lib/i18n/landing";
import { pct, wilson } from "@/lib/probe/stats";

// Same 20% share of voice at three sample sizes; the first matches the sample report.
const PRESETS: [number, number][] = [[5, 1], [20, 4], [50, 10]];

/** Drag the sample size and see how the 95% Wilson interval narrows. Uses the probe's own wilson(). */
export function IntervalDemo({ lang }: { lang: Lang }) {
  const t = LANDING[lang].measure.demo;
  const [n, setN] = useState(5);
  const [k, setK] = useState(1);

  const mentions = Math.min(k, n);
  const share = mentions / n;
  const [lo, hi] = wilson(mentions, n);
  const fmt = (v: number) => (lang === "tr" ? `%${v}` : `${v}%`);
  const interval = `${fmt(pct(lo))} – ${fmt(pct(hi))}`;

  return (
    <div className="ci-card" data-reveal>
      <div className="code-bar">
        <span className="dots" aria-hidden><i /><i /><i /></span>
        <span className="code-file">{t.file}</span>
      </div>

      <div className="ci-body">
        <div className="ci-readout" aria-live="polite">
          <div><span>{t.share}</span><strong>{fmt(pct(share))}</strong></div>
          <div><span>{t.interval}</span><strong>{interval}</strong></div>
          <div><span>{t.width}</span><strong>{pct(hi) - pct(lo)}<small> {t.pts}</small></strong></div>
        </div>

        <div className="ci" role="img" aria-label={`${t.share} ${fmt(pct(share))}, ${t.interval} ${interval}`}>
          <div className="ci-track">
            <i className="ci-band" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />
            <i className="ci-dot" style={{ left: `${share * 100}%` }} />
          </div>
          <div className="ci-scale" aria-hidden><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        </div>

        <div className="ci-controls">
          <label>
            <span>{t.answers} <b>{n}</b></span>
            <input type="range" min={1} max={50} value={n} onChange={(e) => setN(Number(e.target.value))} />
          </label>
          <label>
            <span>{t.mentions} <b>{mentions}</b></span>
            <input type="range" min={0} max={n} value={mentions} onChange={(e) => setK(Number(e.target.value))} />
          </label>
        </div>

        <div className="ci-presets" role="group" aria-label={t.presets}>
          <span>{t.presets}</span>
          {PRESETS.map(([pn, pk]) => (
            <button key={pn} type="button" aria-pressed={n === pn && mentions === pk} onClick={() => { setN(pn); setK(pk); }}>
              {pk} {t.of} {pn}
            </button>
          ))}
        </div>
      </div>

      <p className="code-cap">{t.note}</p>
    </div>
  );
}
