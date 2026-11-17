import type { Lang } from "@/lib/i18n";
import { LANDING } from "@/lib/i18n/landing";
import { PRICES } from "@/lib/pricing";
import { REPO_URL, SITE_URL } from "@/lib/site";
import { auditHref, href, type PageId } from "@/lib/routes";
import { AnswerPreview } from "./AnswerPreview";
import { AuditTool } from "./AuditTool";
import { CodeBlock } from "./CodeBlock";
import { CodeShowcase } from "./CodeShowcase";
import { HeroTerminal } from "./HeroTerminal";
import { Icon, type IconName } from "./Icon";
import { IntervalDemo } from "./IntervalDemo";
import { Marquee } from "./Marquee";
import { Pricing } from "./Pricing";
import { SampleReport } from "./SampleReport";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";

/**
 * The landing sections, split out so each top-level page (product, solutions, how it works,
 * pricing, developers) can compose its own set. `head={false}` drops a section's heading when
 * the page header already says the same thing.
 */

const ICONS: IconName[] = ["scan", "fix", "probe", "ci"];
const STEP_KINDS = ["shell", "diff", "yaml", "json"] as const;

/** Staggers a reveal: sets the delay index CSS reads as `--i`. */
export const rv = (i = 0) => ({ "data-reveal": "", style: { "--i": i } as React.CSSProperties });

export function SectionHead({ kicker, title, lead }: { kicker?: string; title: string; lead?: string }) {
  return (
    <div className="sec-intro" {...rv()}>
      {kicker && <p className="kicker">{kicker}</p>}
      <h2 className="section-title">{title}</h2>
      {lead && <p className="section-lead">{lead}</p>}
    </div>
  );
}

/** Two-column section: heading on the left, content on the right. */
function Split({ id, title, lead, children }: { id?: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section className="section rule" id={id}>
      <div className="container split">
        <div {...rv()}>
          <h2 className="section-title">{title}</h2>
          {lead && <p className="section-lead">{lead}</p>}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function Rows({ items, kv = false }: { items: [string, string][]; kv?: boolean }) {
  return (
    <div className={`rows${kv ? " kv" : ""}`}>
      {items.map(([heading, body], i) => (
        <div className="row-item" key={heading} {...rv(i % 3)}>
          <h3>{heading}</h3>
          <p>{body}</p>
        </div>
      ))}
    </div>
  );
}

/** Nav, main and footer around a page's sections. */
export function PageShell({ lang, page, children }: { lang: Lang; page: PageId; children: React.ReactNode }) {
  return (
    <>
      <SiteNav lang={lang} page={page} />
      <main>{children}</main>
      <SiteFooter lang={lang} />
    </>
  );
}

/** Header band for an inner page: the page's h1 and lead over the hero background. */
export function PageHead({ kicker, title, lead }: { kicker: string; title: string; lead?: string }) {
  return (
    <section className="page-head">
      <div className="hero-bg" aria-hidden />
      <div className="container">
        <p className="kicker rise" style={{ "--i": 0 } as React.CSSProperties}>{kicker}</p>
        <h1 className="rise" style={{ "--i": 1 } as React.CSSProperties}>{title}</h1>
        {lead && <p className="lede rise" style={{ "--i": 2 } as React.CSSProperties}>{lead}</p>}
      </div>
    </section>
  );
}

export function HeroSection({ lang }: { lang: Lang }) {
  const t = LANDING[lang];
  const emAt = t.hero.title.indexOf(t.hero.titleEm);
  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden />
      <div className="container hero-grid">
        <div className="hero-text">
          <p className="badge rise" style={{ "--i": 0 } as React.CSSProperties}>
            <span className="pulse" aria-hidden />
            {t.hero.badge}
            <span className="badge-note">{t.hero.badgeNote}</span>
          </p>
          <h1 className="rise" style={{ "--i": 1 } as React.CSSProperties}>
            {emAt < 0 ? t.hero.title : (
              <>
                {t.hero.title.slice(0, emAt)}
                <em className="grad">{t.hero.titleEm}</em>
                {t.hero.title.slice(emAt + t.hero.titleEm.length)}
              </>
            )}
          </h1>
          <p className="lede rise" style={{ "--i": 2 } as React.CSSProperties}>{t.hero.lead}</p>
        </div>
        <AuditTool
          lang={lang}
          preview={<SampleReport lang={lang} />}
          footer={
            <div className="hero-foot">
              <ul className="trust-row">{t.hero.trust.map((x) => <li key={x}>{x}</li>)}</ul>
              <a className="text-link" href={href("method", lang)}>{t.hero.secondary}</a>
            </div>
          }
        />
        <div className="hero-term rise" style={{ "--i": 3 } as React.CSSProperties}>
          <AnswerPreview lang={lang} />
        </div>
      </div>
    </section>
  );
}

export function FactsSection({ lang }: { lang: Lang }) {
  const t = LANDING[lang].facts;
  return (
    <section className="facts rule" aria-label={t.label}>
      <div className="container">
        <ul className="facts-row">
          {t.items.map(([value, label], i) => (
            <li className="fact" key={label} {...rv(i)}>
              <strong {...(/^%?\d+%?$/.test(value) ? { "data-count": "" } : {})}>{value}</strong>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
      <Marquee lang={lang} />
    </section>
  );
}

/** Purpose: why readability for AI is the problem, shown as the same page seen two ways. */
export function WhySection({ lang }: { lang: Lang }) {
  const t = LANDING[lang].why;
  return (
    <section className="section rule" id="why">
      <div className="container">
        <SectionHead kicker={t.kicker} title={t.title} lead={t.lead} />
        <div className="why-grid">
          <ol className="stages">
            {t.stages.map(([no, name, question, scope], i) => (
              <li key={no} {...rv(i)}>
                <span className="stage-no">{no}</span>
                <div>
                  <h3>{name}</h3>
                  <p>{question}</p>
                  <p className="scope">{scope}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="compare">
            <CodeBlock file={t.browser.file} kind="html" code={t.browserCode} caption={t.browser.caption} tone="good" />
            <div className="compare-link" aria-hidden {...rv(1)}><span>URL</span></div>
            <CodeBlock file={t.crawler.file} kind="html" code={t.crawlerCode} caption={t.crawler.caption} tone="bad" delay={2} />
            <p className="verdict" {...rv(3)}>
              <span className="tk-fail">{t.verdict.status}</span>
              <b>{t.verdict.title}</b>
              <span className="tk-dim">({t.verdict.points}) {t.verdict.detail}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Home-page signposts to the inner pages. */
export function ExploreSection({ lang }: { lang: Lang }) {
  const t = LANDING[lang].explore;
  return (
    <section className="section light" id="explore">
      <div className="container">
        <SectionHead title={t.title} lead={t.lead} />
        <div className="explore">
          {t.items.map((item, i) => (
            <a className="cell spot explore-card" key={item.page} href={href(item.page, lang)} {...rv(i % 4)}>
              <span className="cell-icon"><Icon name={item.icon} /></span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <span className="explore-more">{t.more}<Icon name="arrow" size={15} /></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Who it is for: the same problem told in each audience's own words. */
export function SegmentsSection({ lang, head = true }: { lang: Lang; head?: boolean }) {
  const t = LANDING[lang].segments;
  return (
    <section className="section light" id="solutions">
      <div className="container">
        {head && <SectionHead kicker={t.kicker} title={t.title} lead={t.lead} />}
        <div className="cells segs">
          {t.items.map((seg, i) => (
            <article className="cell spot seg" key={seg.title} {...rv(i % 2)}>
              <span className="cell-icon"><Icon name={seg.icon} /></span>
              <h3>{seg.title}</h3>
              <p className="scope">{seg.who}</p>
              <p className="seg-ask"><span>{t.askLabel}</span>{seg.ask}</p>
              <ul className="seg-list">
                {seg.points.slice(0, 2).map((pt) => <li key={pt}><Icon name="check" size={16} />{pt}</li>)}
              </ul>
              <p className="seg-plan"><span>{t.planLabel}</span> <a href={href("pricing", lang)}>{seg.plan}</a></p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection({ lang, head = true }: { lang: Lang; head?: boolean }) {
  const t = LANDING[lang].capabilities;
  return (
    <section className="section light" id="features">
      <div className="container">
        {head && <SectionHead title={t.title} lead={t.lead} />}
        <div className="cells">
          {t.items.map((item, i) => (
            <article className="cell spot" key={item.title} {...rv(i % 2)}>
              <span className="cell-icon"><Icon name={ICONS[i]} /></span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <p className="scope">{item.scope}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WorkflowSection({ lang, head = true }: { lang: Lang; head?: boolean }) {
  const t = LANDING[lang].workflow;
  return (
    <section className="section light" id="workflow">
      <div className="container">
        {head && <SectionHead title={t.title} lead={t.lead} />}
        <ol className="timeline">
          {t.items.map((s, i) => (
            <li className="tl-step" key={s.step}>
              <div className="tl-rail" aria-hidden {...rv()}><span>{i + 1}</span></div>
              <div className="tl-text" {...rv()}>
                <p className="tl-meta"><span>{s.step}</span><span>{s.time}</span></p>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <p className="out"><span>{t.outLabel}</span> {s.out}</p>
              </div>
              <CodeBlock file={s.file} kind={STEP_KINDS[i]} code={s.code} delay={1} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function OutputSection({ lang }: { lang: Lang }) {
  const t = LANDING[lang].code;
  return (
    <Split id="output" title={t.title} lead={t.lead}>
      <CodeShowcase lang={lang} />
      <p className="caption">{t.caption}</p>
    </Split>
  );
}

export function MeasureSection({ lang }: { lang: Lang }) {
  const t = LANDING[lang].measure;
  return (
    <section className="section rule" id="measure">
      <div className="container">
        <SectionHead kicker={t.kicker} title={t.title} lead={t.lead} />
        <div className="measure-grid">
          <IntervalDemo lang={lang} />
          <Rows items={t.points} />
        </div>
      </div>
    </section>
  );
}

export function ContextSection({ lang }: { lang: Lang }) {
  const t = LANDING[lang].context;
  return (
    <section className="section light" id="context">
      <div className="container">
        <SectionHead title={t.title} lead={t.lead} />
        <ul className="context">
          {t.items.map((m, i) => (
            <li key={m.title} {...rv(i)}>
              <strong>{m.fact}</strong>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
              <a href={m.href} target="_blank" rel="noopener noreferrer">{m.source}</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PricingSection({ lang, head = true }: { lang: Lang; head?: boolean }) {
  const t = LANDING[lang].pricing;
  return (
    <section className="section light" id="pricing">
      <div className="container">
        {head && <SectionHead title={t.title} lead={t.lead} />}
        <Pricing lang={lang} />
      </div>
    </section>
  );
}

export function DevelopersSection({ lang }: { lang: Lang }) {
  const t = LANDING[lang].developers;
  return (
    <section className="section rule" id="developers">
      <div className="container dev-grid">
        <HeroTerminal lang={lang} />
        <div>
          <Rows items={t.items} kv />
          <p className="caption"><a className="text-link" href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a></p>
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ lang }: { lang: Lang }) {
  const t = LANDING[lang].faq;
  return (
    <>
      <Split id="faq" title={t.title}>
        <div className="faq-list">
          {t.items.map((f, i) => (
            <details className="faq" key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <div className="answer">{f.a}</div>
            </details>
          ))}
        </div>
      </Split>
      <JsonLd data={{
        "@type": "FAQPage",
        mainEntity: t.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />
    </>
  );
}

export function CtaSection({ lang }: { lang: Lang }) {
  const t = LANDING[lang].cta;
  return (
    <section className="cta">
      <div className="cta-glow" aria-hidden />
      <div className="container">
        <h2 {...rv()}>{t.title}</h2>
        <p {...rv(1)}>{t.body}</p>
        <div className="actions" {...rv(2)}>
          <a className="btn btn-light btn-lg" href={auditHref(lang)}>{t.button}<Icon name="arrow" size={16} /></a>
          <span className="cta-or">{t.or}</span>
          <a className="btn ghost btn-lg" href={href("pricing", lang)}>{t.secondary}</a>
        </div>
      </div>
    </section>
  );
}

/** Product structured data with every plan's price in every currency. */
export function ProductJsonLd({ lang }: { lang: Lang }) {
  const t = LANDING[lang];
  return (
    <JsonLd data={{
      "@type": "SoftwareApplication",
      name: "Quovra",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      license: "https://www.gnu.org/licenses/agpl-3.0.html",
      inLanguage: lang,
      description: t.meta.description,
      offers: t.pricing.plans.flatMap((plan) => (["USD", "EUR", "GBP", "TRY"] as const).map((cur) => ({
        "@type": "Offer", name: plan.name, price: PRICES[plan.id][cur].monthly, priceCurrency: cur,
      }))),
    }} />
  );
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c") }}
    />
  );
}
