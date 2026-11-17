import { AI_BOTS } from "@/lib/audit/robots";
import type { Lang } from "@/lib/i18n";
import { LANDING } from "@/lib/i18n/landing";

/**
 * The AI agents the audit checks against robots.txt, as a slow scrolling strip.
 * It lists what the code really evaluates; it is not a customer logo wall.
 */
export function Marquee({ lang }: { lang: Lang }) {
  const t = LANDING[lang].agents;
  const items = AI_BOTS.map((b) => (
    <li key={b.bot}>
      <span className={`purpose ${b.purpose}`} aria-hidden />
      <b>{b.bot}</b>
      <em>{b.vendor}</em>
      <small>{t.purpose[b.purpose]}</small>
    </li>
  ));
  return (
    <section className="marquee-wrap" aria-label={t.label.replace("{n}", String(AI_BOTS.length))}>
      <p className="marquee-label">{t.label.replace("{n}", String(AI_BOTS.length))}</p>
      <div className="marquee">
        <ul className="marquee-track">{items}</ul>
        <ul className="marquee-track" aria-hidden>{items}</ul>
      </div>
    </section>
  );
}
