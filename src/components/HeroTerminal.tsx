"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { LANDING } from "@/lib/i18n/landing";
import { highlight } from "@/lib/highlight";

const TONE = { FAIL: "tk-fail", WARN: "tk-warn", PASS: "tk-add-fg" } as Record<string, string>;
const TYPE_MS = 26;

type Row = { key: string; cls: string; node: React.ReactNode; gap?: number };

/**
 * The CLI run from the hero, replayed with pure CSS animation: every line is in the markup from the
 * start (so it reads fine without JavaScript or with reduced motion) and is revealed by a per-line
 * delay. Replay remounts the body, which restarts the animations.
 */
export function HeroTerminal({ lang }: { lang: Lang }) {
  const t = LANDING[lang].terminal;
  const sample = LANDING[lang].sample;
  const [run, setRun] = useState(0);

  // Same numbers as the sample report below it, so the two surfaces tell one story.
  const score = sample.metrics[0][1];
  const grade = sample.metrics[0][3].slice(-1);
  const command = `npm run audit -- ${sample.site}${lang === "tr" ? " --lang=tr" : ""} --min-score=80`;

  const rows: Row[] = [
    { key: "h", cls: "", node: <><b>{t.header}</b>  <span className="tk-dim">https://{sample.site}/</span></> },
    { key: "s", cls: "", node: <b>Score {score}/100  Grade {grade}</b> },
    { key: "g1", cls: "gap", node: " " },
  ];
  t.checks.forEach(([status, title, points, detail, fix], i) => {
    rows.push({ key: `c${i}`, cls: "", node: <><span className={TONE[status]}>{status}</span> {title} <span className="tk-dim">({points})</span></> });
    if (detail) rows.push({ key: `d${i}`, cls: "sub", node: <span className="tk-dim">{detail}</span>, gap: 70 });
    if (fix) rows.push({ key: `f${i}`, cls: "sub arrow", node: <>→ {fix}</>, gap: 70 });
  });
  rows.push(
    { key: "m", cls: "", node: <span className="tk-com">{t.more}</span> },
    { key: "g2", cls: "gap", node: " " },
    { key: "b", cls: "", node: <>{t.blockedLabel} <span className="tk-fail">{t.blocked}</span></> },
    { key: "x", cls: "", node: <span className="tk-com">{t.gate}</span> },
  );

  // Cumulative delays: the command types first, then the output follows line by line.
  const startAt = 450;
  let at = startAt + (command.length + 2) * TYPE_MS + 380;
  const timed = rows.map((r) => {
    const d = at;
    at += r.cls === "gap" ? 90 : (r.gap ?? 170);
    return { ...r, d };
  });

  return (
    <div className="term">
      <div className="term-bar">
        <span className="dots" aria-hidden><i /><i /><i /></span>
        <span className="term-title">{t.file}</span>
        <span className="term-tag"><span className="dot" aria-hidden />{t.tag}</span>
        <button type="button" className="term-replay" onClick={() => setRun((n) => n + 1)} aria-label={t.replay} title={t.replay}>
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2.5 8a5.5 5.5 0 1 0 1.8-4.1" /><path d="M2.5 2.5v3h3" />
          </svg>
        </button>
      </div>
      <div className="term-body" role="img" aria-label={t.summary} key={run}>
        <div className="tl cmd" aria-hidden>
          <span className="typed" style={{ "--n": command.length + 2, "--t": `${startAt}ms`, "--dur": `${(command.length + 2) * TYPE_MS}ms` } as React.CSSProperties}>
            {highlight(`$ ${command}`, "shell")}
          </span>
        </div>
        {timed.map((r) => (
          <div key={r.key} className={`tl ${r.cls}`} style={{ "--d": `${r.d}ms` } as React.CSSProperties} aria-hidden>{r.node}</div>
        ))}
        <div className="tl cmd" style={{ "--d": `${at + 200}ms` } as React.CSSProperties} aria-hidden>
          <span className="tk-prompt">$</span> <span className="cursor" />
        </div>
      </div>
    </div>
  );
}
