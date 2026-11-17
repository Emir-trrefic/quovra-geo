/**
 * Plans: prices, exactly what each plan includes, and the unit economics behind them.
 *
 * ENTITLEMENTS is the single source of truth for what a customer gets. The pricing page table and
 * plan cards are generated from it, and tests/pricing.test.ts checks that every paid plan keeps a
 * healthy gross margin even when the customer uses its whole quota. Change a limit or a price here
 * and the test tells you if the plan stops paying for itself.
 *
 * Prices are set per market, not converted at the exchange rate, so each currency shows a round,
 * locally sensible price. Yearly prices are the per-month equivalent with two months free.
 */
export type Currency = "USD" | "EUR" | "GBP" | "TRY";
export type PlanId = "free" | "starter" | "growth" | "agency";
export type Engine = "chatgpt" | "claude";
export type Support = "community" | "email" | "priority" | "priority-call";

export const CURRENCIES: { code: Currency; symbol: string; locale: string }[] = [
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "EUR", symbol: "€", locale: "de-DE" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
  { code: "TRY", symbol: "₺", locale: "tr-TR" },
];

export interface Entitlements {
  /** Websites tracked. */
  sites: number;
  /** Buyer questions tracked in total, shared across the plan's sites. */
  questions: number;
  /** Times each question is asked per engine at every measurement, for the confidence interval. */
  runs: number;
  engines: Engine[];
  /** Measurements per month (weekly ≈ 4.33). 0 = no tracking. */
  measurementsPerMonth: number;
  /** Pages re-audited every week, in total. */
  pagesMonitored: number;
  /** Pages per on-demand site scan. */
  scanPages: number;
  /** Competitors compared and tracked per site. */
  competitorsPerSite: number;
  /** Which fixes the report shows. */
  fixes: "top3" | "all";
  /** Ready-made llms.txt and Organization JSON-LD. */
  generatedFiles: boolean;
  /** Email when the score or share of voice drops, or a new competitor appears. */
  alerts: boolean;
  /** Report download with your own logo and colours. */
  whiteLabel: boolean;
  /** Probe and tracking data over an authenticated API. (The audit API is open to everyone.) */
  api: boolean;
  seats: number;
  support: Support;
}

const WEEKLY = 52 / 12;

export const ENTITLEMENTS: Record<PlanId, Entitlements> = {
  free: {
    sites: 0, questions: 0, runs: 0, engines: [], measurementsPerMonth: 0, pagesMonitored: 0,
    scanPages: 3, competitorsPerSite: 3, fixes: "top3", generatedFiles: false, alerts: false,
    whiteLabel: false, api: false, seats: 1, support: "community",
  },
  starter: {
    sites: 1, questions: 10, runs: 3, engines: ["chatgpt", "claude"], measurementsPerMonth: WEEKLY, pagesMonitored: 25,
    scanPages: 10, competitorsPerSite: 3, fixes: "all", generatedFiles: true, alerts: true,
    whiteLabel: false, api: false, seats: 1, support: "email",
  },
  growth: {
    sites: 3, questions: 30, runs: 3, engines: ["chatgpt", "claude"], measurementsPerMonth: WEEKLY, pagesMonitored: 100,
    scanPages: 10, competitorsPerSite: 5, fixes: "all", generatedFiles: true, alerts: true,
    whiteLabel: false, api: false, seats: 3, support: "priority",
  },
  agency: {
    sites: 15, questions: 100, runs: 3, engines: ["chatgpt", "claude"], measurementsPerMonth: WEEKLY, pagesMonitored: 500,
    scanPages: 10, competitorsPerSite: 5, fixes: "all", generatedFiles: true, alerts: true,
    whiteLabel: true, api: true, seats: 10, support: "priority-call",
  },
};

export const PRICES: Record<PlanId, Record<Currency, { monthly: number; yearly: number }>> = {
  free: { USD: { monthly: 0, yearly: 0 }, EUR: { monthly: 0, yearly: 0 }, GBP: { monthly: 0, yearly: 0 }, TRY: { monthly: 0, yearly: 0 } },
  starter: { USD: { monthly: 39, yearly: 32 }, EUR: { monthly: 36, yearly: 30 }, GBP: { monthly: 31, yearly: 26 }, TRY: { monthly: 1990, yearly: 1650 } },
  growth: { USD: { monthly: 99, yearly: 82 }, EUR: { monthly: 92, yearly: 76 }, GBP: { monthly: 79, yearly: 65 }, TRY: { monthly: 4990, yearly: 4150 } },
  agency: { USD: { monthly: 299, yearly: 249 }, EUR: { monthly: 279, yearly: 229 }, GBP: { monthly: 239, yearly: 199 }, TRY: { monthly: 14990, yearly: 12490 } },
};

/** One-time done-for-you setup, starting price: up to 10 pages, one round of revisions. */
export const SETUP_FROM: Record<Currency, number> = { USD: 199, EUR: 185, GBP: 159, TRY: 9990 };

// ---------- Unit economics ----------

/**
 * Estimated provider cost of one probe answer in USD, at full quota.
 * Claude: claude-opus-5-5 at $4 / $20 per million tokens, ~300 input and ~1,000 output tokens
 * (answer plus low-effort thinking) ≈ $0.021. ChatGPT: Responses API with web search, where the
 * search call and the retrieved pages dominate; budgeted conservatively at $0.04.
 * Re-check against the providers' price pages when models or prices change.
 */
export const COST_PER_ANSWER_USD: Record<Engine, number> = { claude: 0.021, chatgpt: 0.04 };
/** Hosting, page re-audits, email and storage per paying customer per month. */
export const FIXED_COST_USD = 2;
/** Card processing and payment provider fees, as a share of revenue. */
export const PAYMENT_FEE = 0.04;
/**
 * Rough value of one unit of each currency in USD, only for the margin check.
 * TRY moves fast (50.42 TL per USD on 2026-11-17): update this before changing TRY prices, and re-price when the test fails.
 */
export const USD_VALUE: Record<Currency, number> = { USD: 1, EUR: 1.08, GBP: 1.27, TRY: 1 / 50.42 };
/** The lowest gross margin a paid plan may have when the customer uses its whole quota. */
export const MIN_GROSS_MARGIN = 0.6;

/** Probe answers a plan uses per month at full quota. */
export function answersPerMonth(plan: PlanId): number {
  const e = ENTITLEMENTS[plan];
  return e.questions * e.runs * e.engines.length * e.measurementsPerMonth;
}

/** Provider plus fixed cost per month in USD at full quota, before payment fees. */
export function monthlyCostUsd(plan: PlanId): number {
  const e = ENTITLEMENTS[plan];
  if (e.measurementsPerMonth === 0) return 0;
  const perMeasurement = e.engines.reduce((s, eng) => s + COST_PER_ANSWER_USD[eng], 0) * e.questions * e.runs;
  return perMeasurement * e.measurementsPerMonth + FIXED_COST_USD;
}

/** Gross margin at full quota for a price, after provider costs and payment fees. */
export function grossMargin(plan: PlanId, currency: Currency, billing: "monthly" | "yearly"): number {
  const revenue = PRICES[plan][currency][billing] * USD_VALUE[currency];
  if (revenue === 0) return 0;
  return (revenue * (1 - PAYMENT_FEE) - monthlyCostUsd(plan)) / revenue;
}

// ---------- Display helpers ----------

const EURO_LANGS = ["de", "fr", "es", "it", "nl", "pt", "fi", "el", "sk", "sl", "et", "lv", "lt", "ga", "mt", "hr"];

/** Best-guess currency from the browser's languages and time zone. */
export function guessCurrency(languages: readonly string[], timeZone = ""): Currency {
  const primary = (languages[0] ?? "").toLowerCase();
  if (primary.startsWith("tr") || timeZone === "Europe/Istanbul") return "TRY";
  if (primary === "en-gb" || timeZone === "Europe/London") return "GBP";
  if (EURO_LANGS.includes(primary.split("-")[0])) return "EUR";
  if (timeZone.startsWith("Europe/")) return "EUR";
  return "USD";
}

export function formatMoney(amount: number, currency: Currency): string {
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const n = new Intl.NumberFormat(c.locale, { maximumFractionDigits: 0 }).format(amount);
  return currency === "EUR" ? `${n} €` : `${c.symbol}${n}`;
}
