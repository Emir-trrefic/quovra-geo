import type { Lang } from "@/lib/i18n";
import { LANDING } from "@/lib/i18n/landing";

/** A static, labelled mock of an AI assistant answer that names three competitors and not the visitor. */
export function AnswerPreview({ lang }: { lang: Lang }) {
  const t = LANDING[lang].answer;
  return (
    <figure className="answer-card" aria-label={t.note}>
      <div className="answer-bar">
        <span className="answer-dot" aria-hidden />
        <span>{t.app}</span>
      </div>
      <p className="answer-q">{t.question}</p>
      <div className="answer-a">
        <p>{t.intro}</p>
        <ol>
          {t.picks.map((name, i) => (
            <li key={name} style={{ "--i": i } as React.CSSProperties}><span className="answer-rank">{i + 1}</span>{name}</li>
          ))}
        </ol>
      </div>
      <p className="answer-you">
        <span>{t.you}</span>
        <b>{t.missing}</b>
      </p>
      <figcaption>{t.note}</figcaption>
    </figure>
  );
}
