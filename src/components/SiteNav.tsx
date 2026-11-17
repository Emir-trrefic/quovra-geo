import type { Lang } from "@/lib/i18n";
import { LANDING } from "@/lib/i18n/landing";
import { Logo } from "./Logo";
import { PageFX } from "./PageFX";
import { auditHref, href, type PageId } from "@/lib/routes";

export function SiteNav({ lang, page = "home" }: { lang: Lang; page?: PageId }) {
  const t = LANDING[lang].nav;
  const other: Lang = lang === "tr" ? "en" : "tr";
  const items: [PageId, string][] = [
    ["product", t.product],
    ["solutions", t.solutions],
    ["workflow", t.workflow],
    ["pricing", t.pricing],
    ["developers", t.developers],
    ["method", t.method],
  ];
  const links: [string, string, boolean][] = items.map(([id, label]) => [label, href(id, lang), id === page]);
  return (
    <header className="site-nav">
      <PageFX />
      <div className="container nav">
        <Logo href={href("home", lang)} />
        <nav className="nav-center" aria-label="Main">
          {links.map(([label, to, active]) => <a key={label} href={to} aria-current={active ? "page" : undefined}>{label}</a>)}
        </nav>
        <div className="nav-right">
          <a href={href(page, other)} hrefLang={other} className="lang-switch" aria-label={lang === "tr" ? "English" : "Türkçe"}>{t.switchLabel}</a>
          <a href={auditHref(lang)} className="btn btn-sm">{t.cta}</a>
          <details className="nav-mobile">
            <summary aria-label="Menu"><span /><span /></summary>
            <div className="nav-mobile-panel">
              {links.map(([label, to, active]) => <a key={label} href={to} aria-current={active ? "page" : undefined}>{label}</a>)}
            </div>
          </details>
        </div>
      </div>
      <div className="nav-progress" aria-hidden />
    </header>
  );
}
