import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { gradeFor, runAudit, summarize } from "@/lib/audit";
import { jsonLdNodes, load, meta, uniqueWordCount, visibleText, wordCount } from "@/lib/audit/extract";
import { pickPages } from "@/lib/audit/sitemap";
import type { CheckResult } from "@/lib/audit/types";
import { opts } from "./helpers";

const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
const GOOD = readFileSync(new URL("./fixtures/good.html", import.meta.url), "utf8").replace("REPLACE_TEXT", words);
const urlset = (...locs: string[]) =>
  `<?xml version="1.0"?><urlset>${locs.map((l) => `<url><loc>${l}</loc></url>`).join("")}</urlset>`;

describe("grades and summaries", () => {
  it("maps score boundaries to grades", () => {
    expect([100, 85, 84, 70, 69, 55, 54, 40, 39, 0].map(gradeFor)).toEqual(["A", "A", "B", "B", "C", "C", "D", "D", "F", "F"]);
  });

  it("sums category scores and maxima", () => {
    const c = (category: CheckResult["category"], score: number, weight: number) =>
      ({ id: `${category}${score}`, category, title: "", status: "pass", score, weight, detail: "" }) as CheckResult;
    const s = summarize([c("access", 10, 10), c("access", 0, 5), c("content", 2.5, 5)]);
    expect(s.score).toBe(63);
    expect(s.categories.access).toEqual({ score: 10, max: 15 });
    expect(s.categories.trust).toEqual({ score: 0, max: 0 });
  });
});

describe("extraction", () => {
  it("reads meta tags regardless of case and returns null for blanks", () => {
    const $ = load('<meta NAME="Description" content=" Hi "><meta property="og:title" content="  ">');
    expect(meta($, "description")).toBe("Hi");
    expect(meta($, "og:title")).toBeNull();
  });

  it("flattens @graph and typed nested entities without looping on shared objects", () => {
    const $ = load(`<script type="application/ld+json">[{"@type":"WebPage","mainEntity":{"@type":"Product"},"about":[{"@type":"Thing"}]},
      {"@graph":[{"@type":"Organization"}]}]</script>`);
    expect(jsonLdNodes($).length).toBe(5);
  });

  it("counts words and unique words, ignoring punctuation and case", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("a — b, c")).toBe(3);
    expect(uniqueWordCount("Shoes, shoes SHOES! boots")).toBe(2);
    expect(uniqueWordCount("")).toBe(0);
  });

  it("drops scripts, templates and hidden elements from visible text", () => {
    const $ = load('<body>Hi<script>x()</script><template>t</template><span aria-hidden="true">no</span><p style="VISIBILITY:hidden">no</p></body>');
    expect(visibleText($)).toBe("Hi");
  });
});

describe("page picking", () => {
  it("scans www and http sitemap entries on the site's own origin, once each", () => {
    const picked = pickPages(
      ["https://www.acme.test/a", "http://acme.test/a/", "https://acme.test/b#top", "ftp://acme.test/c", "https://cdn.acme.test/d", "https://notacme.test/e"],
      "https://acme.test", ["https://acme.test/"], 10,
    );
    expect(picked).toEqual(["https://acme.test/a", "https://acme.test/b"]);
  });

  it("skips assets and feeds", () => {
    const assets = ["/f.pdf", "/i.avif", "/feed.rss", "/s.xml.gz", "/d.docx", "/f.woff2"].map((p) => `https://a.test${p}`);
    expect(pickPages(assets, "https://a.test", [], 10)).toEqual([]);
  });
});

describe("runAudit hardening", () => {
  it("treats a robots.txt server error as blocking every AI crawler", async () => {
    const report = await runAudit("https://acme.test", opts({ "/": { body: GOOD }, "/robots.txt": { body: "oops", status: 503 } }));
    expect(report.bots.every((b) => !b.allowed)).toBe(true);
    expect(report.checks.find((c) => c.id === "ai-search-bots")!.status).toBe("fail");
  });

  it("treats a robots.txt 404 or HTML page as no rules", async () => {
    const report = await runAudit("https://acme.test", opts({ "/": { body: GOOD }, "/robots.txt": { body: "<!doctype html><html></html>" } }));
    expect(report.bots.every((b) => b.allowed)).toBe(true);
  });

  it("follows one level of sitemap index, de-duplicates and ignores non-sitemap XML", async () => {
    const log: string[] = [];
    const index = `<?xml version="1.0"?><sitemapindex><sitemap><loc>https://acme.test/s1.xml</loc></sitemap>
      <sitemap><loc>https://acme.test/s1.xml</loc></sitemap><sitemap><loc>https://acme.test/s2.xml.gz</loc></sitemap></sitemapindex>`;
    const report = await runAudit("https://acme.test", {
      ...opts({
        "/": { body: GOOD },
        "/robots.txt": { body: "User-agent: *\nAllow: /\nSitemap: https://acme.test/index.xml\nSitemap: https://acme.test/rss.xml", type: "text/plain" },
        "/index.xml": { body: index, type: "application/xml" },
        "/rss.xml": { body: '<?xml version="1.0"?><rss></rss>', type: "application/xml" },
        "/s1.xml": { body: urlset("https://www.acme.test/x", "https://acme.test/x", "https://acme.test/y"), type: "application/xml" },
        "/x": { body: GOOD },
        "/y": { body: GOOD },
      }, log),
      maxPages: 10,
    });
    expect(log.filter((p) => p === "/s1.xml")).toHaveLength(1);
    expect(log).not.toContain("/s2.xml.gz");
    expect(report.pages?.map((p) => p.url)).toEqual(["https://acme.test/x", "https://acme.test/y"]);
    expect(report.siteScore).toBeGreaterThan(0);
  });

  it("falls back to homepage links when there is no sitemap", async () => {
    const report = await runAudit("https://acme.test", { ...opts({ "/": { body: GOOD }, "/pricing": { body: GOOD } }), maxPages: 3 });
    expect(report.checks.find((c) => c.id === "sitemap")!.status).toBe("fail");
    expect(report.pages?.map((p) => p.url)).toEqual(["https://acme.test/about", "https://acme.test/pricing"]);
  });
});
