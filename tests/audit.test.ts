import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { runAudit } from "@/lib/audit";
import { FREE_FIXES, toFreeView } from "@/lib/audit/freeView";
import { opts } from "./helpers";

const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
const GOOD = readFileSync(new URL("./fixtures/good.html", import.meta.url), "utf8").replace("REPLACE_TEXT", words);
const SPA = `<!doctype html><html><head><title>App</title></head><body><div id="root"></div><script src="/app.js"></script></body></html>`;

describe("free report", () => {
  it("keeps every finding but only the top fixes and no generated files", async () => {
    const report = await runAudit("acme.test", opts({ "/": { body: SPA } }));
    const free = toFreeView(report);
    expect(free.checks).toHaveLength(report.checks.length);
    expect(free.score).toBe(report.score);
    const withFix = free.checks.filter((c) => c.status !== "pass" && c.fix);
    expect(withFix).toHaveLength(FREE_FIXES);
    expect(free.generated.llmsTxt).toBe("");
    expect(free.generated.robotsTxt).toBe(report.generated.robotsTxt);
  });
});

describe("runAudit", () => {
  it("accepts a sitemap and llms.txt served with a text/html content type", async () => {
    const report = await runAudit("https://acme.test/", opts({
      "/": { body: GOOD },
      "/sitemap.xml": { body: '<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>' },
      "/llms.txt": { body: "# Acme\n\n- [Pricing](https://acme.test/pricing)" },
    }));
    const byId = Object.fromEntries(report.checks.map((c) => [c.id, c]));
    expect(byId["sitemap"].status).toBe("pass");
    expect(byId["llms-txt"].status).toBe("pass");
  });

  it("recognises Organization subtypes such as Dentist and MedicalOrganization", async () => {
    const clinic = `<!doctype html><html lang="en"><head><title>Smile Dental</title>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":["Dentist","MedicalOrganization"],"name":"Smile Dental"}</script>
      </head><body><h1>Smile Dental</h1><p>${words}</p></body></html>`;
    const report = await runAudit("https://acme.test/", opts({ "/": { body: clinic } }));
    const byId = Object.fromEntries(report.checks.map((c) => [c.id, c]));
    expect(byId["authorship"].score).toBeGreaterThan(0);
    expect(byId["structured-data"].score).toBeGreaterThanOrEqual(8);
  });

  it("scores a well-optimised page highly", async () => {
    const report = await runAudit("https://acme.test/", opts({
      "/": { body: GOOD },
      "/robots.txt": { body: "User-agent: *\nAllow: /\nSitemap: https://acme.test/sitemap.xml", type: "text/plain" },
      "/llms.txt": { body: "# Acme\n\n> Invoicing\n\n- [Pricing](https://acme.test/pricing)", type: "text/plain" },
    }));
    expect(report.score).toBeGreaterThanOrEqual(85);
    expect(report.grade).toBe("A");
    expect(report.page.schemaTypes).toContain("FAQPage");
    expect(report.generated.llmsTxt).toContain("# Acme");
    expect(report.generated.llmsTxt).toContain("https://acme.test/pricing");
    expect(report.generated.jsonLd).toContain("linkedin.com/company/acme");
  });

  it("flags JavaScript-only pages and blocked AI search bots", async () => {
    const report = await runAudit("acme.test", opts({
      "/": { body: SPA },
      "/robots.txt": { body: "User-agent: OAI-SearchBot\nDisallow: /\nUser-agent: PerplexityBot\nDisallow: /", type: "text/plain" },
    }));
    const byId = Object.fromEntries(report.checks.map((c) => [c.id, c]));
    expect(byId["server-rendered"].status).toBe("fail");
    expect(byId["ai-search-bots"].status).toBe("warn");
    expect(byId["ai-search-bots"].detail).toContain("OAI-SearchBot");
    expect(byId["llms-txt"].status).toBe("fail");
    expect(report.score).toBeLessThan(40);
  });

  it("treats an HTML soft-404 as a missing llms.txt", async () => {
    const report = await runAudit("https://acme.test", opts({ "/": { body: GOOD }, "/llms.txt": { body: "<!doctype html><html></html>" } }));
    expect(report.checks.find((c) => c.id === "llms-txt")?.status).toBe("fail");
  });

  it("weights sum to 100", async () => {
    const report = await runAudit("https://acme.test", opts({ "/": { body: GOOD } }));
    expect(report.checks.reduce((s, c) => s + c.weight, 0)).toBe(100);
  });
});
