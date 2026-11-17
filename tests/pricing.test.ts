import { describe, expect, it } from "vitest";
import { planHighlights, planTable } from "@/lib/i18n/plans";
import {
  answersPerMonth, CURRENCIES, ENTITLEMENTS, grossMargin, MIN_GROSS_MARGIN, monthlyCostUsd, PRICES, type PlanId,
} from "@/lib/pricing";

const PAID: PlanId[] = ["starter", "growth", "agency"];

describe("plan economics", () => {
  it.each(PAID)("%s keeps its minimum gross margin at full usage in every currency and billing period", (plan) => {
    for (const { code } of CURRENCIES) {
      for (const billing of ["monthly", "yearly"] as const) {
        expect(grossMargin(plan, code, billing), `${plan} ${code} ${billing}`).toBeGreaterThanOrEqual(MIN_GROSS_MARGIN);
      }
    }
  });

  it("costs nothing to serve the free plan's AI", () => {
    expect(answersPerMonth("free")).toBe(0);
    expect(monthlyCostUsd("free")).toBe(0);
  });

  it("gives every higher plan at least as much as the one below, for more money", () => {
    const order: PlanId[] = ["free", "starter", "growth", "agency"];
    const numeric = ["sites", "questions", "pagesMonitored", "scanPages", "competitorsPerSite", "seats"] as const;
    for (let i = 1; i < order.length; i++) {
      const [lo, hi] = [ENTITLEMENTS[order[i - 1]], ENTITLEMENTS[order[i]]];
      for (const k of numeric) expect(hi[k], `${order[i]}.${k}`).toBeGreaterThanOrEqual(lo[k]);
      for (const { code } of CURRENCIES) expect(PRICES[order[i]][code].monthly).toBeGreaterThan(PRICES[order[i - 1]][code].monthly);
    }
  });

  it("charges less per month on yearly billing", () => {
    for (const plan of PAID) for (const { code } of CURRENCIES) {
      expect(PRICES[plan][code].yearly).toBeLessThan(PRICES[plan][code].monthly);
    }
  });
});

describe("pricing page", () => {
  it("builds a full comparison row for every plan, in both languages", () => {
    for (const lang of ["en", "tr"] as const) {
      const table = planTable(lang);
      expect(table.length).toBeGreaterThan(10);
      for (const row of table) expect(row).toHaveLength(5);
    }
  });

  it("states the real limits on the plan cards", () => {
    expect(planHighlights("en", "starter")[0]).toBe(`1 site · ${ENTITLEMENTS.starter.questions} buyer questions`);
    expect(planHighlights("tr", "agency")[0]).toContain(String(ENTITLEMENTS.agency.sites));
    expect(planTable("en").find(([l]) => l.startsWith("AI answers"))?.[2]).toBe("~260");
  });

  it("promises nothing that is not live", () => {
    for (const lang of ["en", "tr"] as const) {
      const text = JSON.stringify([planTable(lang), ...(["free", "starter", "growth", "agency"] as const).map((p) => planHighlights(lang, p))]);
      expect(text).not.toMatch(/soon|yakında|planned|planlı/i);
    }
  });
});
