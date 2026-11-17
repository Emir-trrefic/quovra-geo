import type { Lang } from "@/lib/i18n";
import { LANDING } from "@/lib/i18n/landing";
import { REFERENCES } from "@/lib/references";

export function References({ lang }: { lang: Lang }) {
  if (REFERENCES.length === 0) return null;
  const t = LANDING[lang].references;
  return (
    <section className="section rule" id="references">
      <div className="container">
        <h2 className="section-title">{t.title}</h2>
        {REFERENCES.map((r) => (
          <article className="case" key={r.metric + r.sector.en}>
            <div className="case-head">
              <p className="sector">{r.sector[lang]}</p>
              <p className="big">{r.metric}</p>
              <p className="cap">{r.metricCaption[lang]}</p>
            </div>
            <dl className="case-body">
              <div className="pair"><dt>{t.problem}</dt><dd>{r.problem[lang]}</dd></div>
              <div className="pair"><dt>{t.approach}</dt><dd>{r.approach[lang]}</dd></div>
              <div className="pair"><dt>{t.result}</dt><dd>{r.result[lang]}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
