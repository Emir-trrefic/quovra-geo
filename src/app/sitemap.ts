import type { MetadataRoute } from "next";
import { ROUTES, type PageId } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

const PRIORITY: Partial<Record<PageId, number>> = { home: 1, product: 0.9, solutions: 0.9, pricing: 0.9, workflow: 0.8, developers: 0.7, guide: 0.7, method: 0.6, investors: 0.5 };

export default function sitemap(): MetadataRoute.Sitemap {
  return (Object.keys(ROUTES) as PageId[]).flatMap((page) => {
    const languages = { en: `${SITE_URL}${ROUTES[page].en}`, tr: `${SITE_URL}${ROUTES[page].tr}` };
    return (["en", "tr"] as const).map((lang) => ({
      url: languages[lang],
      changeFrequency: page === "home" ? ("weekly" as const) : ("monthly" as const),
      priority: (PRIORITY[page] ?? 0.5) - (lang === "tr" ? 0.05 : 0),
      alternates: { languages },
    }));
  });
}
