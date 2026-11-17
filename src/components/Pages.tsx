import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n";
import { LANDING } from "@/lib/i18n/landing";
import { ROUTES } from "@/lib/routes";
import { References } from "./References";
import {
  ContextSection, CtaSection, DevelopersSection, FaqSection, FeaturesSection, MeasureSection, OutputSection,
  PageHead, PageShell, PricingSection, ProductJsonLd, SegmentsSection, WhySection, WorkflowSection,
} from "./sections";

export type InnerPage = "product" | "solutions" | "workflow" | "pricing" | "developers";

/** Title, description and hreflang alternates for an inner page. */
export function pageMetadata(page: InnerPage, lang: Lang): Metadata {
  const t = LANDING[lang].pages[page];
  return {
    title: t.metaTitle,
    description: t.description,
    alternates: { canonical: ROUTES[page][lang], languages: { en: ROUTES[page].en, tr: ROUTES[page].tr } },
    openGraph: { title: t.metaTitle, description: t.description },
  };
}

export function InnerPageView({ page, lang }: { page: InnerPage; lang: Lang }) {
  const t = LANDING[lang];
  const head = <PageHead kicker={t.nav[page]} title={t.pages[page].title} lead={t.pages[page].lead} />;
  return (
    <PageShell lang={lang} page={page}>
      {head}
      {page === "product" && (
        <>
          <FeaturesSection lang={lang} head={false} />
          <WhySection lang={lang} />
          <OutputSection lang={lang} />
          <ContextSection lang={lang} />
        </>
      )}
      {page === "solutions" && (
        <>
          <SegmentsSection lang={lang} head={false} />
          <References lang={lang} />
        </>
      )}
      {page === "workflow" && (
        <>
          <WorkflowSection lang={lang} head={false} />
          <MeasureSection lang={lang} />
        </>
      )}
      {page === "pricing" && (
        <>
          <PricingSection lang={lang} head={false} />
          <FaqSection lang={lang} />
          <ProductJsonLd lang={lang} />
        </>
      )}
      {page === "developers" && <DevelopersSection lang={lang} />}
      <CtaSection lang={lang} />
    </PageShell>
  );
}
