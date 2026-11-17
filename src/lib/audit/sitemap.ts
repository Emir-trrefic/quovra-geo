import { load } from "./extract";

/** Extracts <loc> URLs from a sitemap or sitemap index. */
export function parseSitemap(xml: string): { urls: string[]; sitemaps: string[] } {
  const $ = load(xml);
  const locs = (sel: string) => $(sel).map((_, el) => $(el).text().trim()).get().filter(Boolean);
  return { urls: locs("url > loc"), sitemaps: locs("sitemap > loc") };
}

const UTILITY_PAGE = /(^|\/)(kvkk|gizlilik|cerez|çerez|aydinlatma|aydınlatma|privacy|cookie|cookies|terms|imprint|impressum|legal|disclaimer|iletisim|iletişim|contact|kurumsal|login|giris|giriş|register|uye|üye|account|hesap|cart|sepet|checkout|odeme|ödeme|search|arama|tag|etiket|author|yazar|feed|404)(\/|$|[-_.])/i;
/** A bare language root such as /tr, /de or /en-gb: usually the home page again in another language. */
const LANGUAGE_ROOT = /^\/[a-z]{2}(-[a-z]{2})?\/?$/i;

/**
 * Chooses up to `limit` distinct same-origin page URLs, preferring short paths
 * (top-level pages usually matter most for AI visibility) and skipping assets.
 */
export function pickPages(candidates: string[], origin: string, exclude: string[], limit: number): string[] {
  const seen = new Set(exclude.map((u) => u.replace(/\/$/, "")));
  const out: URL[] = [];
  for (const raw of candidates) {
    try {
      const u = new URL(raw, origin);
      u.hash = "";
      const key = u.toString().replace(/\/$/, "");
      if (u.origin !== origin || seen.has(key)) continue;
      if (/\.(pdf|jpe?g|png|gif|webp|svg|zip|xml|mp4|css|js)$/i.test(u.pathname)) continue;
      seen.add(key);
      out.push(u);
    } catch {
      /* skip invalid URL */
    }
  }
  const depth = (u: URL) => u.pathname.split("/").filter(Boolean).length;
  // Legal, account and utility pages say little about what a business offers, so they go last.
  const utility = (u: URL) => (UTILITY_PAGE.test(u.pathname) || LANGUAGE_ROOT.test(u.pathname) ? 1 : 0);
  return out
    .sort((a, b) => utility(a) - utility(b) || depth(a) - depth(b) || a.pathname.length - b.pathname.length)
    .slice(0, limit)
    .map((u) => u.toString());
}
