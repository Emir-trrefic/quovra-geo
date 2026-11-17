import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { runAudit } from "@/lib/audit";
import type { AuditReport } from "@/lib/audit/types";
import { buildComparison, compareSites, prepareCompetitors } from "@/lib/compare";
import { analyzeAnswer, aggregate, hostnameOf, splitRecommendation } from "@/lib/probe";
import { fakeFetch } from "./helpers";

const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
const GOOD = readFileSync(new URL("./fixtures/good.html", import.meta.url), "utf8").replace("REPLACE_TEXT", words);
const THIN = `<!doctype html><html><head><title>Thin</title></head><body><p>Hello</p></body></html>`;

/** One fake internet: each host serves its own home page. */
function web(sites: Record<string, string | Error>) {
  return (async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    const page = sites[url.hostname];
    if (page instanceof Error) throw page;
    if (page === undefined || url.pathname !== "/") return new Response("<html>nf</html>", { status: 404, headers: { "content-type": "text/html" } });
    return new Response(page, { status: 200, headers: { "content-type": "text/html" } });
  }) as typeof fetch;
}
const audit = (url: string, html: string) => runAudit(url, { fetchImpl: fakeFetch({ "/": { body: html } }), skipHostCheck: true });

describe("buildComparison", () => {
  it("ranks sites and lists the checks where competitors are ahead, biggest first", async () => {
    const you = await audit("https://thin.test", THIN);
    const rival = await audit("https://rival.test", GOOD);
    const c = buildComparison(you, [{ name: "Rival", url: "https://rival.test/", report: rival }]);
    expect(c.rank).toBe(2);
    expect(c.ranked).toBe(2);
    expect(c.competitorAvg).toBe(rival.score);
    expect(c.gaps.length).toBeGreaterThan(3);
    expect(["server-rendered", "structured-data"]).toContain(c.gaps[0].id);
    for (let i = 1; i < c.gaps.length; i++) expect(c.gaps[i - 1].impact).toBeGreaterThanOrEqual(c.gaps[i].impact);
    expect(c.gaps.every((g) => g.ahead.includes("Rival") && g.best > g.you)).toBe(true);
    expect(c.gaps.find((g) => g.id === "structured-data")?.fix).toBeTruthy();
    expect(c.strengths).toEqual([]);
  });

  it("reports your strengths when you beat every competitor", async () => {
    const you = await audit("https://good.test", GOOD);
    const rival = await audit("https://thin.test", THIN);
    const c = buildComparison(you, [{ name: "Thin", url: "https://thin.test/", report: rival }]);
    expect(c.rank).toBe(1);
    expect(c.gaps).toEqual([]);
    expect(c.strengths.map((s) => s.id)).toContain("structured-data");
  });

  it("weights a gap by how many competitors are ahead", async () => {
    const you = await audit("https://thin.test", THIN);
    const good = await audit("https://a.test", GOOD);
    const thin = await audit("https://b.test", THIN);
    const one = buildComparison(you, [{ name: "A", url: "", report: good }]).gaps.find((g) => g.id === "structured-data")!;
    const half = buildComparison(you, [{ name: "A", url: "", report: good }, { name: "B", url: "", report: thin }]).gaps.find((g) => g.id === "structured-data")!;
    expect(half.impact).toBeCloseTo(one.impact / 2, 1);
    expect(half.ahead).toEqual(["A"]);
  });

  it("keeps unreachable competitors in the table but out of the maths", async () => {
    const you = await audit("https://thin.test", THIN);
    const c = buildComparison(you, [{ name: "Down", url: "https://down.test/", error: "timeout" }]);
    expect(c.competitors[0]).toMatchObject({ name: "Down", ok: false, error: "timeout" });
    expect(c.gaps).toEqual([]);
    expect(c.competitorAvg).toBeNull();
    expect(c.rank).toBe(1);
  });

  it("ignores tiny differences", () => {
    const report = (score: number) => ({
      lang: "en", finalUrl: "https://x.test/", score, grade: "C",
      categories: {} as AuditReport["categories"],
      checks: [{ id: "speed", category: "technical", title: "Speed", status: "pass", score, weight: 2, detail: "" }],
    }) as unknown as AuditReport;
    expect(buildComparison(report(1.9), [{ name: "R", url: "", report: report(2) }]).gaps).toEqual([]);
  });
});

describe("prepareCompetitors", () => {
  it("drops your own site, duplicates, invalid and unsafe URLs, and keeps three", () => {
    const list = prepareCompetitors("acme.test", [
      { url: "www.acme.test" }, { url: "blog.acme.test" }, { url: "ftp://x.test" }, { url: "" },
      { url: "rival.test", name: " Rival " }, { url: "https://www.rival.test/about" },
      { url: "two.test" }, { url: "three.test" }, { url: "four.test" },
    ]);
    expect(list).toEqual([
      { name: "Rival", url: "https://rival.test/" },
      { name: "two.test", url: "https://two.test/" },
      { name: "three.test", url: "https://three.test/" },
    ]);
  });
});

describe("compareSites", () => {
  it("audits everyone once, in parallel, and survives a competitor that is down", async () => {
    const fetchImpl = web({ "acme.test": THIN, "rival.test": GOOD, "down.test": new TypeError("ECONNREFUSED") });
    const c = await compareSites("acme.test", [{ url: "rival.test", name: "Rival" }, { url: "down.test" }], { fetchImpl, skipHostCheck: true, lang: "tr" });
    expect(c.lang).toBe("tr");
    expect(c.you.name).toBe("acme.test");
    expect(c.competitors.map((x) => [x.name, x.ok])).toEqual([["Rival", true], ["down.test", false]]);
    expect(c.gaps.length).toBeGreaterThan(0);
    expect(c.gaps[0].title).not.toMatch(/^[A-Z][a-z]+ [a-z]/); // Turkish titles
  });

  it("refuses a comparison without real competitors", async () => {
    await expect(compareSites("acme.test", [{ url: "www.acme.test" }], { fetchImpl: web({}), skipHostCheck: true })).rejects.toThrow("at least one");
  });
});

describe("competitor websites from the probe", () => {
  it("parses hostnames and recommendation entries", () => {
    expect(hostnameOf("https://www.Acme.com.tr/x?y")).toBe("acme.com.tr");
    expect(hostnameOf("not a domain")).toBeNull();
    expect(splitRecommendation("Smile Dental (smiledental.com)")).toEqual({ name: "Smile Dental", domain: "smiledental.com" });
    expect(splitRecommendation("Smile Dental [www.smile.com]")).toEqual({ name: "Smile Dental", domain: "smile.com" });
    expect(splitRecommendation("Smile Dental (Istanbul)")).toEqual({ name: "Smile Dental (Istanbul)" });
    expect(splitRecommendation("rival.io")).toEqual({ name: "rival.io", domain: "rival.io" });
  });

  it("keeps competitor websites through aggregation and recognises you by domain", () => {
    const text = "Options…\nRECOMMENDED: Bright Smile (brightsmile.com) | Our Clinic (acme.test) | Dentaris";
    const a = analyzeAnswer("best clinic", text, "Acme Dental", "acme.test");
    expect(a.position).toBe(2);
    expect(a.competitors).toEqual(["Bright Smile", "Dentaris"]);
    expect(a.sites).toEqual({ "Bright Smile": "brightsmile.com" });
    const report = aggregate("Acme Dental", "test", [[a, analyzeAnswer("best clinic", "RECOMMENDED: Dentaris (dentaris.com)", "Acme Dental")]]);
    expect(report.topCompetitors).toEqual([
      { name: "Dentaris", count: 2, domain: "dentaris.com" },
      { name: "Bright Smile", count: 1, domain: "brightsmile.com" },
    ]);
  });
});
