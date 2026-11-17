import type { Lang } from "./i18n";

/** Every top-level page with its English and Turkish path. */
export const ROUTES = {
  home: { en: "/", tr: "/tr" },
  product: { en: "/product", tr: "/tr/urun" },
  solutions: { en: "/solutions", tr: "/tr/kimin-icin" },
  workflow: { en: "/how-it-works", tr: "/tr/nasil-calisir" },
  pricing: { en: "/pricing", tr: "/tr/fiyatlar" },
  developers: { en: "/developers", tr: "/tr/gelistiriciler" },
  method: { en: "/methodology", tr: "/tr/yontem" },
  guide: { en: "/guide", tr: "/tr/rehber" },
  investors: { en: "/investors", tr: "/tr/yatirimci" },
} as const;

export type PageId = keyof typeof ROUTES;

export const href = (page: PageId, lang: Lang): string => ROUTES[page][lang];

/** The free audit form lives at the top of the home page. */
export const auditHref = (lang: Lang): string => `${ROUTES.home[lang]}#top`;
