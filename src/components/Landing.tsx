import type { Lang } from "@/lib/i18n";
import {
  CtaSection, ExploreSection, FactsSection, HeroSection, PageShell, ProductJsonLd,
} from "./sections";

/** Home page: the promise, the free audit and signposts to the inner pages. */
export function Landing({ lang }: { lang: Lang }) {
  return (
    <PageShell lang={lang} page="home">
      <HeroSection lang={lang} />
      <FactsSection lang={lang} />
      <ExploreSection lang={lang} />
      <CtaSection lang={lang} />
      <ProductJsonLd lang={lang} />
    </PageShell>
  );
}
