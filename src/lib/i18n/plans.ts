import { answersPerMonth, ENTITLEMENTS, type PlanId, type Support } from "../pricing";
import type { Lang } from "./index";

/** A comparison-table cell: true/false render as ✓/—, strings as text. */
export type Cell = string | boolean;

const PLAN_IDS: PlanId[] = ["free", "starter", "growth", "agency"];

const num = (n: number, lang: Lang) => new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-US").format(Math.round(n));
/** Rounded to a friendly figure: 260, 780, 2,600. */
const approx = (n: number) => (n >= 1000 ? Math.round(n / 100) * 100 : Math.round(n / 10) * 10);

const COPY = {
  en: {
    support: {
      community: "Community (GitHub)",
      email: "Email, reply within 2 business days",
      priority: "Priority email, within 1 business day",
      "priority-call": "Priority email + 30-min strategy call each quarter",
    } satisfies Record<Support, string>,
    rows: {
      audits: "Audits, score and all 22 findings",
      fixes: "Step-by-step fixes",
      files: "Ready-made llms.txt & structured data",
      scan: "Pages per on-demand site scan",
      compare: "Competitor comparison",
      sites: "Websites tracked",
      questions: "Buyer questions tracked (shared across sites)",
      engines: "AI engines",
      cadence: "Measurement",
      answers: "AI answers analysed per month",
      ci: "95% confidence interval",
      pages: "Pages re-audited weekly",
      alerts: "Score-drop & new-competitor alerts",
      whiteLabel: "White-label PDF reports",
      api: "Probe & tracking API",
      seats: "Seats",
      support: "Support",
    },
    cells: {
      auditsFree: "20 per hour", unlimited: "Unlimited", top3: "Top 3 issues", all: "All",
      compareFree: "3 sites, on demand", comparePaid: (n: number) => `${n} per site, weekly`,
      weekly: (runs: number) => `Weekly, each question ${runs}× per engine`, oneOff: "—",
      engines: "ChatGPT + Claude",
    },
    highlights: (id: PlanId, lang: Lang): string[] => {
      const e = ENTITLEMENTS[id];
      const answers = `~${num(approx(answersPerMonth(id)), lang)}`;
      switch (id) {
        case "free": return ["Unlimited audits, full score", "All 22 checks and findings", "Fixes for your top 3 issues", "Compare with 3 competitors"];
        case "starter": return [`${e.sites} site · ${e.questions} buyer questions`, "ChatGPT + Claude, measured weekly", `${answers} AI answers analysed a month`, "Every fix + ready-made files"];
        case "growth": return [`${e.sites} sites · ${e.questions} buyer questions`, `${e.competitorsPerSite} competitors tracked per site`, `${answers} AI answers analysed a month`, `${e.seats} seats · priority support`];
        case "agency": return [`${e.sites} client sites · ${e.questions} buyer questions`, "White-label PDF reports", `API access · ${e.seats} seats`, "Quarterly strategy call"];
      }
    },
    roadmap: "Planned, not yet included in any plan: Gemini, Perplexity and Google AI Overviews, AI bot traffic analytics, and WordPress, Shopify, ikas and Ticimax integrations. A feature joins a plan only once it is live.",
  },
  tr: {
    support: {
      community: "Topluluk (GitHub)",
      email: "E-posta, 2 iş günü içinde yanıt",
      priority: "Öncelikli e-posta, 1 iş günü içinde",
      "priority-call": "Öncelikli e-posta + çeyrekte bir 30 dk strateji görüşmesi",
    } satisfies Record<Support, string>,
    rows: {
      audits: "Denetim, puan ve 22 bulgunun tamamı",
      fixes: "Adım adım çözümler",
      files: "Hazır llms.txt ve yapısal veri",
      scan: "İstek üzerine taramada sayfa sayısı",
      compare: "Rakip karşılaştırma",
      sites: "Takip edilen site",
      questions: "Takip edilen müşteri sorusu (siteler arasında ortak)",
      engines: "Yapay zekâ motoru",
      cadence: "Ölçüm",
      answers: "Ayda incelenen yapay zekâ cevabı",
      ci: "%95 güven aralığı",
      pages: "Haftalık yeniden denetlenen sayfa",
      alerts: "Puan düşüşü ve yeni rakip uyarıları",
      whiteLabel: "Kendi markanızla PDF rapor",
      api: "Probe ve takip API'si",
      seats: "Kullanıcı",
      support: "Destek",
    },
    cells: {
      auditsFree: "Saatte 20", unlimited: "Sınırsız", top3: "En önemli 3 sorun", all: "Tümü",
      compareFree: "3 site, istek üzerine", comparePaid: (n: number) => `Site başına ${n}, haftalık`,
      weekly: (runs: number) => `Haftalık, her soru motor başına ${runs} kez`, oneOff: "—",
      engines: "ChatGPT + Claude",
    },
    highlights: (id: PlanId, lang: Lang): string[] => {
      const e = ENTITLEMENTS[id];
      const answers = `~${num(approx(answersPerMonth(id)), lang)}`;
      switch (id) {
        case "free": return ["Sınırsız denetim, tam puan", "22 kontrolün tüm bulguları", "En önemli 3 sorunun çözümü", "3 rakiple karşılaştırma"];
        case "starter": return [`${e.sites} site · ${e.questions} müşteri sorusu`, "ChatGPT + Claude, haftalık ölçüm", `Ayda ${answers} yapay zekâ cevabı`, "Tüm çözümler + hazır dosyalar"];
        case "growth": return [`${e.sites} site · ${e.questions} müşteri sorusu`, `Site başına ${e.competitorsPerSite} rakip takibi`, `Ayda ${answers} yapay zekâ cevabı`, `${e.seats} kullanıcı · öncelikli destek`];
        case "agency": return [`${e.sites} müşteri sitesi · ${e.questions} soru`, "Kendi markanızla PDF rapor", `API erişimi · ${e.seats} kullanıcı`, "Çeyreklik strateji görüşmesi"];
      }
    },
    roadmap: "Planlanan, henüz hiçbir pakete dahil olmayanlar: Gemini, Perplexity ve Google AI Overviews; AI bot trafik analitiği; WordPress, Shopify, ikas ve Ticimax entegrasyonları. Bir özellik ancak yayına girdiğinde pakete eklenir.",
  },
};

export function planHighlights(lang: Lang, id: PlanId): string[] {
  return COPY[lang].highlights(id, lang);
}

export function planRoadmap(lang: Lang): string {
  return COPY[lang].roadmap;
}

/** The plan comparison table, built from ENTITLEMENTS so the page can never promise more than the plans contain. */
export function planTable(lang: Lang): [string, ...Cell[]][] {
  const t = COPY[lang];
  const each = (f: (id: PlanId) => Cell) => PLAN_IDS.map(f);
  const e = (id: PlanId) => ENTITLEMENTS[id];
  const tracked = (id: PlanId) => e(id).measurementsPerMonth > 0;
  const dash = (id: PlanId, v: Cell) => (tracked(id) ? v : t.cells.oneOff);
  return [
    [t.rows.audits, ...each((id) => (id === "free" ? t.cells.auditsFree : t.cells.unlimited))],
    [t.rows.fixes, ...each((id) => (e(id).fixes === "all" ? t.cells.all : t.cells.top3))],
    [t.rows.files, ...each((id) => e(id).generatedFiles)],
    [t.rows.scan, ...each((id) => num(e(id).scanPages, lang))],
    [t.rows.compare, ...each((id) => (tracked(id) ? t.cells.comparePaid(e(id).competitorsPerSite) : t.cells.compareFree))],
    [t.rows.sites, ...each((id) => dash(id, num(e(id).sites, lang)))],
    [t.rows.questions, ...each((id) => dash(id, num(e(id).questions, lang)))],
    [t.rows.engines, ...each((id) => dash(id, t.cells.engines))],
    [t.rows.cadence, ...each((id) => dash(id, t.cells.weekly(e(id).runs)))],
    [t.rows.answers, ...each((id) => dash(id, `~${num(approx(answersPerMonth(id)), lang)}`))],
    [t.rows.ci, ...each(tracked)],
    [t.rows.pages, ...each((id) => dash(id, num(e(id).pagesMonitored, lang)))],
    [t.rows.alerts, ...each((id) => e(id).alerts)],
    [t.rows.whiteLabel, ...each((id) => e(id).whiteLabel)],
    [t.rows.api, ...each((id) => e(id).api)],
    [t.rows.seats, ...each((id) => num(e(id).seats, lang))],
    [t.rows.support, ...each((id) => t.support[e(id).support])],
  ];
}
