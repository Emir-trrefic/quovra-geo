import type { AnyNode } from "domhandler";
import type { Lang } from "../i18n";
import {
  type Doc, jsonLdNodes, meta, nodesOfType, schemaTypes, typesOf, uniqueWordCount, visibleText, wordCount,
} from "./extract";
import { CHECK_MESSAGES, type CheckMessages } from "./messages";
import { AI_BOTS } from "./robots";
import type { BotAccess, Category, CheckResult, PageSnapshot, SiteFiles, Status } from "./types";

export interface CheckContext {
  $: Doc;
  page: PageSnapshot;
  files: SiteFiles;
  bots: BotAccess[];
  lang?: Lang;
  now?: Date;
}

type Check = (ctx: CheckContext, m: CheckMessages) => CheckResult;
type Node = Record<string, unknown>;

/**
 * Schema.org types that state who a business is. Sites rarely use plain Organization: clinics use
 * MedicalOrganization or Dentist, hotels Hotel, shops Store, and so on, so the common subtypes count too.
 */
const ORG_TYPES = new Set([
  "Organization", "Corporation", "LocalBusiness", "OnlineBusiness", "OnlineStore", "NGO", "EducationalOrganization",
  "MedicalOrganization", "MedicalBusiness", "MedicalClinic", "Hospital", "Dentist", "Physician", "Pharmacy",
  "DiagnosticLab", "VeterinaryCare", "HealthAndBeautyBusiness", "BeautySalon", "DaySpa", "HairSalon",
  "LegalService", "Attorney", "Notary", "AccountingService", "FinancialService", "InsuranceAgency", "RealEstateAgent",
  "ProfessionalService", "HomeAndConstructionBusiness", "AutomotiveBusiness", "AutoDealer", "AutoRepair",
  "FoodEstablishment", "Restaurant", "CafeOrCoffeeShop", "Bakery", "BarOrPub", "FastFoodRestaurant",
  "LodgingBusiness", "Hotel", "Motel", "Resort", "BedAndBreakfast", "Hostel",
  "Store", "ClothingStore", "ElectronicsStore", "FurnitureStore", "GroceryStore", "BookStore", "JewelryStore",
  "SportsActivityLocation", "ExerciseGym", "TravelAgency", "EmploymentAgency", "School", "CollegeOrUniversity",
]);
export const isOrgType = (t: string) => ORG_TYPES.has(t);

const RICH_TYPES = [
  "WebSite", "Article", "BlogPosting", "NewsArticle", "Product", "ProductGroup", "SoftwareApplication", "FAQPage",
  "QAPage", "HowTo", "Person", "Service", "MedicalProcedure", "Review", "AggregateRating", "Event", "Course", "Recipe",
];
const isRichType = (t: string) => isOrgType(t) || RICH_TYPES.includes(t);

/** Linear ramp: 0 at or below `lo`, 1 at or above `hi`. */
export function ramp(x: number, lo: number, hi: number): number {
  if (!Number.isFinite(x) || x <= lo) return 0;
  return x >= hi ? 1 : (x - lo) / (hi - lo);
}

/** Same registrable site, ignoring www and subdomains: blog.acme.com belongs to acme.com, notacme.com does not. */
export function sameSite(a: string, b: string): boolean {
  const x = a.toLowerCase().replace(/^www\./, "");
  const y = b.toLowerCase().replace(/^www\./, "");
  return x === y || x.endsWith(`.${y}`) || y.endsWith(`.${x}`);
}

const text = ($: Doc, el: AnyNode) => $(el).text().replace(/\s+/g, " ").trim();

/** Navigation, header and footer chrome: lists and links there say nothing about the page's answer. */
const CHROME = 'nav, header, footer, aside, [role="navigation"], [role="menu"], [role="menubar"], [role="banner"], [role="contentinfo"]';

function result(
  id: string, category: Category, title: string, weight: number,
  ratio: number, detail: string, fix: string,
): CheckResult {
  const r = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;
  const status: Status = r >= 0.85 ? "pass" : r >= 0.4 ? "warn" : "fail";
  return {
    id, category, title, weight, detail,
    score: Math.round(r * weight * 10) / 10,
    status,
    fix: status === "pass" ? undefined : fix,
  };
}

// ---------- Site-level checks (robots.txt, llms.txt, sitemap) ----------

const aiSearchBots: Check = ({ bots, files }, { aiSearch: m }) => {
  const relevant = bots.filter((b) => b.purpose !== "training");
  const blocked = relevant.filter((b) => !b.allowed);
  const detail = files.robotsUnreachable
    ? m.unreachable
    : blocked.length === 0 ? m.ok({ n: relevant.length }) : m.blocked({ bots: blocked.map((b) => b.bot).join(", ") });
  return result(
    "ai-search-bots", "access", m.title, 15, relevant.length === 0 ? 1 : 1 - blocked.length / relevant.length,
    detail, m.fix,
  );
};

const aiTrainingBots: Check = ({ bots }, { aiTraining: m }) => {
  const relevant = bots.filter((b) => b.purpose === "training");
  const blocked = relevant.filter((b) => !b.allowed);
  return result(
    "ai-training-bots", "access", m.title, 2, relevant.length === 0 ? 1 : 1 - blocked.length / relevant.length,
    blocked.length === 0 ? m.ok : m.blocked({ bots: blocked.map((b) => b.bot).join(", ") }),
    m.fix,
  );
};

const llmsTxt: Check = ({ files }, { llms: m }) => {
  const txt = files.llmsTxt?.trim() || null;
  const hasTitle = !!txt && /^#\s+\S/m.test(txt);
  const hasLinks = !!txt && /\[[^\]]+\]\([^)\s]+\)/.test(txt);
  const hasSummary = !!txt && /^>\s*\S/m.test(txt);
  return result(
    "llms-txt", "access", m.title, 6,
    !txt ? 0 : (hasTitle ? 0.45 : 0.2) + (hasLinks ? 0.45 : 0) + (hasSummary ? 0.1 : 0),
    !txt ? m.missing : m.found({ noTitle: !hasTitle, noLinks: !hasLinks }),
    m.fix,
  );
};

const sitemap: Check = ({ files }, { sitemap: m }) =>
  result("sitemap", "access", m.title, 2, files.sitemapFound ? 1 : 0, files.sitemapFound ? m.ok : m.missing, m.fix);

// ---------- Page-level checks ----------

/** User agents whose noindex keeps a page out of AI answers. A rule for some other bot does not. */
const INDEX_AGENTS = new Set(["robots", "googlebot", "bingbot", ...AI_BOTS.map((b) => b.bot.toLowerCase())]);
/** X-Robots-Tag directives that carry a value after a colon, so they are not user-agent prefixes. */
const VALUE_DIRECTIVES = new Set(["unavailable_after", "max-snippet", "max-image-preview", "max-video-preview"]);

/** True when a robots meta tag or X-Robots-Tag header aimed at all crawlers, or at an AI/search crawler, says noindex. */
export function hasNoindex($: Doc, xRobotsTag = ""): boolean {
  const isNoindex = (d: string) => /^(noindex|none)$/.test(d.trim().toLowerCase());

  const metaHit = $("meta[name][content]").toArray().some((el) => {
    const name = ($(el).attr("name") ?? "").trim().toLowerCase();
    return INDEX_AGENTS.has(name) && ($(el).attr("content") ?? "").split(",").some(isNoindex);
  });
  if (metaHit) return true;

  // "googlebot: noindex, nofollow, otherbot: noarchive": a "name:" prefix applies until the next one.
  let agent: string | null = null;
  for (const token of xRobotsTag.split(",")) {
    let directive = token.trim();
    const prefixed = /^([a-z0-9_-]+)\s*:\s*(.*)$/i.exec(directive);
    if (prefixed && !VALUE_DIRECTIVES.has(prefixed[1].toLowerCase())) {
      agent = prefixed[1].toLowerCase();
      directive = prefixed[2];
    }
    if (isNoindex(directive) && (agent === null || INDEX_AGENTS.has(agent))) return true;
  }
  return false;
}

const indexable: Check = ({ $, page }, { indexable: m }) => {
  const noindex = hasNoindex($, page.headers["x-robots-tag"]);
  const ok = page.status >= 200 && page.status < 300;
  return result(
    "indexable", "access", m.title, 5, ok && !noindex ? 1 : 0,
    !ok ? m.status({ status: page.status }) : noindex ? m.noindex : m.ok({ status: page.status }),
    m.fix,
  );
};

const structuredData: Check = ({ $ }, { structured: m }) => {
  const types = schemaTypes(jsonLdNodes($));
  const rich = types.filter(isRichType);
  return result(
    "structured-data", "structure", m.title, 10,
    types.length === 0 ? 0 : 0.4 + Math.min(rich.length, 3) * 0.2,
    types.length === 0 ? m.none : m.found({ types: types.join(", ") }),
    m.fix,
  );
};

/** FAQ markup only counts when it holds at least one named question with an answer. An empty FAQPage is ignored. */
function answeredQuestions(nodes: Node[]): number {
  return [...nodesOfType(nodes, "FAQPage"), ...nodesOfType(nodes, "QAPage")]
    .flatMap((n) => [n.mainEntity].flat())
    .filter((q): q is Node => !!q && typeof q === "object" && typesOf(q as Node).includes("Question"))
    .filter((q) => typeof q.name === "string" && q.name.trim() !== "" && (!!q.acceptedAnswer || !!q.suggestedAnswer))
    .length;
}

const questionContent: Check = ({ $ }, { questions: m }) => {
  const faq = answeredQuestions(jsonLdNodes($)) > 0;
  // Distinct question headings of at least two words: "?" alone or one question repeated does not count twice.
  const questions = new Set(
    $("h2, h3, h4, summary, dt").toArray()
      .map((el) => text($, el))
      .filter((t) => (t.endsWith("?") || t.startsWith("¿")) && wordCount(t) >= 2)
      .map((t) => t.toLocaleLowerCase()),
  );
  const n = questions.size;
  return result("question-content", "structure", m.title, 4, (faq ? 0.5 : 0) + Math.min(n, 3) / 6, m.detail({ n, faq }), m.fix);
};

const headings: Check = ({ $ }, { headings: m }) => {
  const nonEmpty = (sel: string) => $(sel).filter((_, el) => text($, el) !== "").length;
  const h1 = nonEmpty("h1");
  const h2 = nonEmpty("h2");
  const ratio = (h1 === 1 ? 0.6 : h1 > 1 ? 0.3 : 0) + (h2 >= 2 ? 0.4 : h2 === 1 ? 0.2 : 0);
  return result("headings", "structure", m.title, 5, ratio, m.detail({ h1, h2 }), m.fix);
};

/** Placeholder titles that tell an assistant nothing about the business. */
const GENERIC_TITLE = /^(home|home ?page|ana ?sayfa|anasayfa|untitled|untitled document|index|react app|vite app|next\.js app|document|welcome|hoş ?geldiniz|new page|my site|wordpress)$/i;

const titleAndDescription: Check = ({ $ }, { meta: m }) => {
  const title = $("head title, title").first().text().replace(/\s+/g, " ").trim();
  const desc = meta($, "description") ?? "";
  let ratio = 0;
  if (title) {
    if (GENERIC_TITLE.test(title)) ratio += 0.15;
    else ratio += title.length >= 15 && title.length <= 65 ? 0.5 : 0.3;
  }
  if (desc) {
    if (desc.toLocaleLowerCase() === title.toLocaleLowerCase()) ratio += 0.2;
    else ratio += desc.length >= 50 && desc.length <= 170 ? 0.5 : 0.3;
  }
  return result(
    "meta", "structure", m.title, 6, ratio,
    m.detail({ title: title ? title.length : null, desc: desc ? desc.length : null }),
    m.fix,
  );
};

const openGraph: Check = ({ $ }, { og: m }) => {
  const n = ["og:title", "og:description", "og:image"].filter((p) => meta($, p)).length;
  return result("open-graph", "structure", m.title, 2, n / 3, m.detail({ n }), m.fix);
};

/** BCP 47 language tag such as "en", "tr", "pt-BR" or "zh-Hant-TW". */
const LANG_TAG = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i;

const canonicalLang: Check = ({ $, page }, { canonical: m }) => {
  const href = $('link[rel~="canonical" i]').attr("href")?.trim();
  // A canonical on another site hands this page's credit to that site, so it only half counts.
  let canonical = 0;
  if (href) {
    try {
      canonical = sameSite(new URL(href, page.finalUrl).hostname, new URL(page.finalUrl).hostname) ? 0.5 : 0.25;
    } catch {
      canonical = 0;
    }
  }
  const lang = $("html").attr("lang")?.trim() || null;
  const langScore = !lang ? 0 : LANG_TAG.test(lang) ? 0.5 : 0.25;
  return result(
    "canonical-lang", "structure", m.title, 2, canonical + langScore,
    m.detail({ canonical: canonical > 0, lang }), m.fix,
  );
};

const serverRendered: Check = ({ $ }, { rendered: m }) => {
  const visible = visibleText($);
  const words = wordCount(visible);
  // Both length and vocabulary must be there: repeating one sentence 100 times is not 300 words of content.
  const ratio = Math.min(Math.sqrt(ramp(words, 20, 300)), Math.sqrt(ramp(uniqueWordCount(visible), 10, 120)));
  return result("server-rendered", "content", m.title, 10, ratio, m.detail({ words }), m.fix);
};

const answerFormatting: Check = ({ $ }, { formatting: m }) => {
  const lists = $("ul > li, ol > li, dl > dt").filter((_, el) => {
    if ($(el).closest(CHROME).length > 0) return false;
    const own = text($, el);
    // Menu items outside <nav> are lists of links only; content lists carry their own text.
    const linkText = $(el).find("a").toArray().map((a) => text($, a)).join(" ").trim();
    return own !== "" && own !== linkText;
  }).length;
  const tables = $("table").filter((_, el) => {
    const t = $(el);
    if (t.closest(CHROME).length > 0 || /^(presentation|none)$/i.test(t.attr("role") ?? "")) return false;
    const rows = t.find("tr").toArray();
    const widest = Math.max(0, ...rows.map((r) => $(r).children("td, th").length));
    return widest >= 2 && (rows.length >= 2 || t.find("th").length > 0);
  }).length;
  return result(
    "answer-formatting", "content", m.title, 5,
    (lists >= 3 ? 0.6 : lists > 0 ? 0.3 : 0) + (tables > 0 ? 0.4 : 0),
    m.detail({ lists, tables }), m.fix,
  );
};

const EARLIEST_DATE = Date.UTC(1995, 0, 1);

const freshness: Check = ({ $, now = new Date() }, { freshness: m }) => {
  const candidates = [
    ...jsonLdNodes($).flatMap((n) => [n.dateModified, n.datePublished, n.uploadDate]),
    meta($, "article:modified_time"),
    meta($, "article:published_time"),
    meta($, "og:updated_time"),
    ...$("time[datetime]").toArray().map((el) => $(el).attr("datetime")),
  ].filter((v): v is string => typeof v === "string" && v.trim() !== "");
  const latest = candidates
    .map((d) => new Date(d.trim()))
    .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() >= EARLIEST_DATE && d.getTime() <= now.getTime() + 86_400_000)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const ageDays = latest ? (now.getTime() - latest.getTime()) / 86_400_000 : Infinity;
  return result(
    "freshness", "content", m.title, 4, !latest ? 0 : ageDays <= 365 ? 1 : ageDays <= 730 ? 0.6 : 0.3,
    latest ? m.found({ date: latest.toISOString().slice(0, 10) }) : m.none,
    m.fix,
  );
};

/** Profiles and share links, not sources: linking to your own LinkedIn is not citing evidence. */
const SOCIAL_HOST = /(^|\.)(linkedin|twitter|x|facebook|fb|instagram|youtube|youtu|tiktok|pinterest|threads|whatsapp|wa|t|telegram|snapchat)\.(com|me|be|net)$/i;
const STAT = /\b\d+(?:[.,]\d+)?\s?(?:%|percent|percentage points|x\b|times\b|kat\b|million|billion|milyon|milyar|bin\b|k\b)|%\s?\d+(?:[.,]\d+)?/gi;

const evidence: Check = ({ $, page }, { evidence: m }) => {
  const stats = new Set((visibleText($).match(STAT) ?? []).map((s) => s.replace(/\s+/g, "").toLowerCase())).size;
  const host = new URL(page.finalUrl).hostname;
  const sources = new Set(
    $("a[href]").toArray()
      .filter((el) => $(el).closest(CHROME).length === 0)
      .map((el) => {
        try {
          const u = new URL($(el).attr("href")!, page.finalUrl);
          return /^https?:$/.test(u.protocol) && !sameSite(u.hostname, host) && !SOCIAL_HOST.test(u.hostname)
            ? u.hostname.replace(/^www\./, "")
            : null;
        } catch {
          return null;
        }
      })
      .filter((h): h is string => !!h),
  );
  const links = sources.size;
  return result(
    "evidence", "content", m.title, 3, Math.min(stats, 3) / 6 + (links > 0 ? 0.5 : 0),
    m.detail({ stats, links }), m.fix,
  );
};

const authorship: Check = ({ $ }, { authorship: m }) => {
  const nodes = jsonLdNodes($);
  const types = schemaTypes(nodes);
  const n = [
    !!meta($, "author") || $('[rel~="author"]').length > 0 || nodes.some((x) => !!x.author),
    types.includes("Person"),
    types.some(isOrgType),
  ].filter(Boolean).length;
  return result("authorship", "trust", m.title, 4, n / 2, m.detail({ n }), m.fix);
};

const ABOUT = /about|hakkimizda|hakkımızda|hakkinda|hakkında|kurumsal|biz-kimiz|uber-uns|über-uns|ueber-uns|unternehmen|a-propos|à-propos|qui-sommes|quienes|sobre|chi-siamo|over-ons|om-oss|o-nas|our-story|team|ekibimiz/;
const ABOUT_TEXT = /^(about|about us|our story|who we are|hakkımızda|hakkimizda|biz kimiz|kurumsal|über uns|à propos|quiénes somos|sobre nosotros|chi siamo|over ons|om oss|o nas)$/;
const CONTACT = /contact|iletisim|iletişim|kontakt|impressum|contacto|contatti|contato|nous-contacter|bize-ulasin|bize-ulaşın/;
const CONTACT_TEXT = /^(contact|contact us|get in touch|iletişim|iletisim|bize ulaşın|kontakt|impressum|contacto|contatti|contato)$/;

const aboutContact: Check = ({ $, page }, { aboutContact: m }) => {
  const host = new URL(page.finalUrl).hostname;
  let about = false;
  let contact = false;
  for (const el of $("a[href]").toArray()) {
    const href = ($(el).attr("href") ?? "").trim();
    if (/^(mailto|tel):/i.test(href)) {
      contact = true;
      continue;
    }
    let u: URL;
    try {
      u = new URL(href, page.finalUrl);
    } catch {
      continue;
    }
    // An "about" link on someone else's site (twitter.com/about) says nothing about this business.
    if (!sameSite(u.hostname, host)) continue;
    let path: string;
    try {
      path = decodeURIComponent(u.pathname).toLowerCase();
    } catch {
      path = u.pathname.toLowerCase();
    }
    const label = text($, el).toLocaleLowerCase();
    about ||= ABOUT.test(path) || ABOUT_TEXT.test(label);
    contact ||= CONTACT.test(path) || CONTACT_TEXT.test(label);
    if (about && contact) break;
  }
  return result("about-contact", "trust", m.title, 3, (about ? 0.5 : 0) + (contact ? 0.5 : 0), m.detail({ about, contact }), m.fix);
};

const https: Check = ({ page }, { https: m }) => {
  const secure = page.finalUrl.startsWith("https://");
  return result("https", "technical", m.title, 3, secure ? 1 : 0, secure ? m.ok : m.bad, m.fix);
};

const speed: Check = ({ page }, { speed: m }) => {
  const ms = page.responseMs;
  return result("speed", "technical", m.title, 2, 1 - 0.9 * ramp(ms, 1000, 3000), m.detail({ ms }), m.fix);
};

/** Alt text that only repeats a file name or says "image" describes nothing. */
const USELESS_ALT = /^(image|img|photo|picture|resim|görsel|gorsel|fotoğraf|foto|logo|icon|banner|untitled)$|\.(jpe?g|png|gif|webp|svg|avif)$/i;

const imageAlt: Check = ({ $ }, { alt: m }) => {
  // alt="", role="presentation" and 1px tracking pixels mark decorative images, which need no description.
  const imgs = $("img").filter((_, el) => {
    const img = $(el);
    if (img.attr("alt") === "" || /^(presentation|none)$/i.test(img.attr("role") ?? "") || img.attr("aria-hidden") === "true") return false;
    const w = Number(img.attr("width"));
    const h = Number(img.attr("height"));
    return !(w > 0 && w <= 2 && h > 0 && h <= 2);
  });
  const withAlt = imgs.filter((_, el) => {
    const alt = $(el).attr("alt")?.trim() ?? "";
    return alt !== "" && !USELESS_ALT.test(alt);
  }).length;
  return result(
    "image-alt", "technical", m.title, 1, imgs.length === 0 ? 1 : withAlt / imgs.length,
    imgs.length === 0 ? m.none : m.detail({ withAlt, total: imgs.length }),
    m.fix,
  );
};

// ---------- Agent readiness (AI shopping and task agents) ----------

const PRODUCT_FIELDS = ["name", "image", "price", "availability", "brand", "rating"] as const;

const isObj = (v: unknown): v is Node => !!v && typeof v === "object" && !Array.isArray(v);

const productData: Check = ({ $ }, { productData: m }) => {
  const nodes = jsonLdNodes($);
  const product = [...nodesOfType(nodes, "Product"), ...nodesOfType(nodes, "ProductGroup")][0];
  const isProductPage = !!product || meta($, "og:type")?.toLowerCase().startsWith("product") === true;
  if (!isProductPage) return result("product-data", "agent", m.title, 4, 1, m.notApplicable, m.fix);
  if (!product) return result("product-data", "agent", m.title, 4, 0, m.missing, m.fix);

  const offers = [product.offers].flat().filter(isObj);
  const offer = offers[0] ?? {};
  const spec = [offer.priceSpecification].flat().find(isObj) ?? {};
  const hasPrice = [offer.price, offer.lowPrice, spec.price].some((p) => p !== undefined && p !== null && p !== "");
  const has: Record<(typeof PRODUCT_FIELDS)[number], boolean> = {
    name: !!product.name,
    image: !!product.image,
    price: hasPrice && !!(offer.priceCurrency ?? spec.priceCurrency),
    availability: !!offer.availability,
    brand: !!product.brand,
    rating: !!product.aggregateRating || !!product.review,
  };
  const missing = PRODUCT_FIELDS.filter((f) => !has[f]);
  return result(
    "product-data", "agent", m.title, 4, (PRODUCT_FIELDS.length - missing.length) / PRODUCT_FIELDS.length,
    missing.length === 0 ? m.complete : m.partial({ missing: missing.map((f) => m.fields[f]).join(", ") }),
    m.fix,
  );
};

const markdownAccess: Check = ({ $, files }, { markdownAccess: m }) => {
  const alternate = $('link[rel~="alternate" i][type="text/markdown" i]').length > 0;
  const full = !!files.llmsFullTxt && files.llmsFullTxt.trim().length > 200;
  return result(
    "markdown-access", "agent", m.title, 2, full || alternate ? 1 : 0,
    m.detail({ full, alternate }), m.fix,
  );
};

/** Checks that depend on site-wide files rather than the individual page. */
export const SITE_CHECKS: Check[] = [aiSearchBots, aiTrainingBots, llmsTxt, sitemap, markdownAccess];

export const PAGE_CHECKS: Check[] = [
  indexable,
  structuredData, questionContent, headings, titleAndDescription, openGraph, canonicalLang,
  serverRendered, answerFormatting, freshness, evidence,
  authorship, aboutContact,
  https, speed, imageAlt,
  productData,
];

export function runChecks(ctx: CheckContext, checks: Check[] = [...SITE_CHECKS, ...PAGE_CHECKS]): CheckResult[] {
  const m = CHECK_MESSAGES[ctx.lang ?? "en"];
  return checks.map((check) => check(ctx, m));
}
