import { describe, expect, it } from "vitest";
import { hasNoindex, PAGE_CHECKS, ramp, runChecks, sameSite, SITE_CHECKS } from "@/lib/audit/checks";
import { load } from "@/lib/audit/extract";
import { analyzeBots } from "@/lib/audit/robots";
import type { CheckResult, PageSnapshot, SiteFiles } from "@/lib/audit/types";

const NOW = new Date("2026-11-17T12:00:00Z");

interface Ctx {
  head?: string;
  body?: string;
  html?: string;
  page?: Partial<PageSnapshot>;
  files?: Partial<SiteFiles>;
  robots?: string | null;
  lang?: "en" | "tr";
}

/** Runs every check against a page built from parts and returns them by id. */
function audit({ head = "", body = "", html, page = {}, files = {}, robots = null, lang }: Ctx = {}) {
  const doc = html ?? `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
  const snapshot: PageSnapshot = {
    url: "https://acme.test/", finalUrl: "https://acme.test/", status: 200, html: doc, headers: {}, responseMs: 300, ...page,
  };
  const checks = runChecks({
    $: load(doc), page: snapshot, lang, now: NOW,
    files: { robotsTxt: robots, llmsTxt: null, sitemapFound: false, ...files },
    bots: analyzeBots(robots, files.robotsUnreachable),
  });
  return Object.fromEntries(checks.map((c) => [c.id, c])) as Record<string, CheckResult>;
}
const check = (id: string, ctx: Ctx = {}) => audit(ctx)[id];
const ratio = (c: CheckResult) => c.score / c.weight;
const ld = (data: object) => `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", ...data })}</script>`;
const prose = (n: number, prefix = "w") => Array.from({ length: n }, (_, i) => `${prefix}${i}`).join(" ");

describe("scoring helpers", () => {
  it("ramps linearly and clamps", () => {
    expect(ramp(0, 10, 20)).toBe(0);
    expect(ramp(15, 10, 20)).toBe(0.5);
    expect(ramp(99, 10, 20)).toBe(1);
    expect(ramp(Number.NaN, 0, 1)).toBe(0);
  });

  it("treats subdomains and www as the same site, but not look-alike domains", () => {
    expect(sameSite("www.acme.com", "acme.com")).toBe(true);
    expect(sameSite("blog.acme.com", "acme.com")).toBe(true);
    expect(sameSite("notacme.com", "acme.com")).toBe(false);
    expect(sameSite("acme.com.evil.test", "acme.com")).toBe(false);
  });

  it("has one result per check, weights summing to 100, scores within their weight", () => {
    const all = Object.values(audit());
    expect(all).toHaveLength(SITE_CHECKS.length + PAGE_CHECKS.length);
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
    expect(all.reduce((s, c) => s + c.weight, 0)).toBe(100);
    for (const c of all) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(c.weight);
      expect(c.fix === undefined).toBe(c.status === "pass");
    }
  });

  it("never crashes on an empty or broken document", () => {
    for (const html of ["", "<html>", "<<<>>>", "<html><body><table><tr></table>"]) {
      expect(() => audit({ html })).not.toThrow();
    }
  });
});

describe("AI crawler access", () => {
  it("passes when robots.txt is missing", () => {
    expect(check("ai-search-bots").status).toBe("pass");
  });

  it("scores the share of blocked search agents", () => {
    const c = check("ai-search-bots", { robots: "User-agent: OAI-SearchBot\nDisallow: /" });
    expect(ratio(c)).toBeCloseTo(1 - 1 / 9, 1);
    expect(c.detail).toContain("OAI-SearchBot");
  });

  it("fails everything when robots.txt answers with a server error", () => {
    const c = check("ai-search-bots", { files: { robotsUnreachable: true } });
    expect(c.status).toBe("fail");
    expect(c.detail).toContain("server error");
  });

  it("keeps training bots separate from search bots", () => {
    const r = audit({ robots: "User-agent: GPTBot\nDisallow: /\nUser-agent: CCBot\nDisallow: /" });
    expect(r["ai-search-bots"].status).toBe("pass");
    expect(r["ai-training-bots"].status).toBe("warn");
  });
});

describe("llms.txt", () => {
  it("scores title, links and summary", () => {
    expect(check("llms-txt", { files: { llmsTxt: "# Acme\n\n> Invoicing\n\n- [Docs](https://acme.test/docs)" } }).score).toBe(6);
    expect(check("llms-txt", { files: { llmsTxt: "# Acme\n\n- [Docs](/docs)" } }).status).toBe("pass");
    expect(check("llms-txt", { files: { llmsTxt: "# Acme" } }).status).toBe("warn");
    expect(check("llms-txt", { files: { llmsTxt: "   \n" } }).status).toBe("fail");
  });
});

describe("indexability", () => {
  it("fails non-2xx pages and noindex", () => {
    expect(check("indexable", { page: { status: 404 } }).status).toBe("fail");
    expect(check("indexable", { head: '<meta name="robots" content="noindex, follow">' }).status).toBe("fail");
    expect(check("indexable", { head: '<meta name="ROBOTS" content="NONE">' }).status).toBe("fail");
    expect(check("indexable", { page: { headers: { "x-robots-tag": "noindex" } } }).status).toBe("fail");
  });

  it("ignores noindex aimed at unrelated bots and words that only contain 'none'", () => {
    const $ = load('<meta name="yandex" content="noindex"><meta name="robots" content="max-snippet:-1, nonexistent">');
    expect(hasNoindex($)).toBe(false);
    expect(hasNoindex(load(""), "otherbot: noindex")).toBe(false);
    expect(hasNoindex(load(""), "unavailable_after: 2030-01-01, max-snippet: 50")).toBe(false);
  });

  it("applies a user-agent prefix to the directives that follow it", () => {
    expect(hasNoindex(load(""), "googlebot: nofollow, noindex")).toBe(true);
    expect(hasNoindex(load(""), "otherbot: noindex, GPTBot: noarchive")).toBe(false);
    expect(hasNoindex(load(""), "otherbot: nofollow, GPTBot: noindex")).toBe(true);
  });
});

describe("structured data", () => {
  it("rewards distinct rich types and reads @graph, mainEntity and prefixed types", () => {
    expect(check("structured-data").score).toBe(0);
    expect(ratio(check("structured-data", { head: ld({ "@type": "BreadcrumbList" }) }))).toBeCloseTo(0.4);
    const nested = ld({ "@type": "WebPage", mainEntity: { "@type": "https://schema.org/Product", name: "Shoe" } });
    expect(ratio(check("structured-data", { head: nested }))).toBeCloseTo(0.6);
    const graph = ld({ "@graph": [{ "@type": "Organization" }, { "@type": "WebSite" }, { "@type": "Article" }] });
    expect(check("structured-data", { head: graph }).score).toBe(10);
  });

  it("reads JSON-LD wrapped in comments or CDATA and skips broken blocks", () => {
    const wrapped = `<script type="application/ld+json"><!-- {"@type":"Organization","name":"A"} --></script>
      <script type="application/ld+json">{ broken </script>`;
    expect(check("structured-data", { head: wrapped }).detail).toContain("Organization");
  });
});

describe("question content", () => {
  const faq = (mainEntity: unknown) => ld({ "@type": "FAQPage", mainEntity });

  it("only counts FAQ markup that holds answered questions", () => {
    expect(check("question-content", { head: faq([]) }).score).toBe(0);
    const answered = faq([{ "@type": "Question", name: "Is it free?", acceptedAnswer: { "@type": "Answer", text: "Yes." } }]);
    expect(ratio(check("question-content", { head: answered }))).toBeCloseTo(0.5);
  });

  it("counts distinct, real question headings", () => {
    const body = "<h2>Is it free?</h2><h2>Is it free?</h2><h3>?</h3><h3>Why?</h3><summary>How do refunds work?</summary>";
    expect(check("question-content", { body }).detail).toMatch(/^2 /);
  });
});

describe("headings", () => {
  it("wants exactly one non-empty H1 and several H2s", () => {
    expect(check("headings", { body: "<h1>A</h1><h2>B</h2><h2>C</h2>" }).score).toBe(5);
    expect(check("headings", { body: "<h1> </h1><h2>B</h2><h2>C</h2>" }).detail).toMatch(/^0 H1/);
    expect(ratio(check("headings", { body: "<h1>A</h1><h1>B</h1><h2>C</h2>" }))).toBeCloseTo(0.5);
  });
});

describe("title and description", () => {
  const desc = "Acme helps freelancers send invoices and get paid faster, in 30 countries.";

  it("rewards a descriptive title and description of the right length", () => {
    const c = check("meta", { head: `<title>Acme — invoicing for freelancers</title><meta name="Description" content="${desc}">` });
    expect(c.status).toBe("pass");
  });

  it("penalises placeholder titles and descriptions that repeat the title", () => {
    expect(ratio(check("meta", { head: `<title>Home</title><meta name="description" content="${desc}">` }))).toBeCloseTo(0.65);
    const same = "Acme invoicing for freelancers everywhere in the world today";
    expect(ratio(check("meta", { head: `<title>${same}</title><meta name="description" content="${same}">` }))).toBeCloseTo(0.7);
  });
});

describe("canonical and language", () => {
  it("gives full credit to a same-site canonical and a valid language tag", () => {
    expect(check("canonical-lang", { html: '<html lang="pt-BR"><head><link rel="canonical" href="/"></head></html>' }).score).toBe(2);
  });

  it("gives partial credit to a canonical on another site or an invalid lang", () => {
    const c = check("canonical-lang", { html: '<html lang="english please"><head><link rel="canonical" href="https://other.test/"></head></html>' });
    expect(ratio(c)).toBeCloseTo(0.5);
  });
});

describe("server-rendered content", () => {
  it("scales with real words", () => {
    expect(check("server-rendered", { body: '<div id="root"></div>' }).score).toBe(0);
    expect(check("server-rendered", { body: `<p>${prose(400)}</p>` }).status).toBe("pass");
    expect(check("server-rendered", { body: `<p>${prose(120)}</p>` }).status).toBe("warn");
  });

  it("does not reward repeated filler or hidden text", () => {
    expect(check("server-rendered", { body: `<p>${"buy cheap shoes ".repeat(200)}</p>` }).status).toBe("fail");
    const hidden = `<div style="display: none">${prose(400)}</div><div hidden>${prose(400, "h")}</div>`;
    expect(check("server-rendered", { body: hidden }).score).toBe(0);
  });

  it("separates words across block elements", () => {
    expect(check("server-rendered", { body: "<p>one</p><p>two</p><li>three</li>" }).detail).toMatch(/^3 /);
  });
});

describe("answer formatting", () => {
  it("counts content lists and data tables", () => {
    const body = "<ul><li>Free plan</li><li>Pro at $9</li><li>Teams</li></ul><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>";
    expect(check("answer-formatting", { body }).score).toBe(5);
  });

  it("ignores navigation menus, link-only lists and layout tables", () => {
    const body = `<nav><ul><li>Home</li><li>Blog</li><li>Docs</li></ul></nav>
      <ul><li><a href="/a">A</a></li><li><a href="/b">B</a></li><li><a href="/c">C</a></li></ul>
      <table><tr><td>layout</td></tr></table><table role="presentation"><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>`;
    expect(check("answer-formatting", { body }).score).toBe(0);
  });
});

describe("freshness", () => {
  it("uses the newest valid date and decays with age", () => {
    expect(check("freshness", { head: ld({ "@type": "Article", dateModified: "2026-10-01" }) }).score).toBe(4);
    expect(ratio(check("freshness", { head: '<meta property="article:modified_time" content="2025-03-01">' }))).toBeCloseTo(0.6);
    expect(ratio(check("freshness", { body: '<time datetime="2020-01-01">old</time>' }))).toBeCloseTo(0.3);
  });

  it("ignores future, ancient and invalid dates", () => {
    const body = '<time datetime="2099-01-01">x</time><time datetime="1970-01-01">y</time><time datetime="soon">z</time>';
    expect(check("freshness", { body }).score).toBe(0);
  });

  it("finds a valid date even when an invalid one comes first", () => {
    const body = '<time datetime="bad">x</time><time datetime="2026-11-01">y</time>';
    expect(check("freshness", { body }).detail).toContain("2026-11-01");
  });
});

describe("evidence", () => {
  it("counts distinct statistics and outside sources", () => {
    const body = '<p>32% faster, 32% cheaper, 3x more, 40 million users, %15 indirim</p><a href="https://study.example.org/x">study</a>';
    const c = check("evidence", { body });
    expect(c.detail).toMatch(/^4 statistic\(s\), 1 outbound/);
    expect(c.status).toBe("pass");
  });

  it("does not count look-alike domains, subdomains, social profiles or nav links as sources", () => {
    const body = `<a href="https://notacme.test/x">ok</a><a href="https://blog.acme.test/">own</a>
      <a href="https://www.linkedin.com/company/acme">in</a><a href="https://x.com/acme">x</a><nav><a href="https://partner.test">p</a></nav>`;
    expect(check("evidence", { body }).detail).toContain("1 outbound");
  });
});

describe("authorship", () => {
  it("counts author, person and organization signals", () => {
    expect(check("authorship").score).toBe(0);
    expect(check("authorship", { head: ld({ "@type": "Article", author: { "@type": "Person", name: "Jane" } }) }).status).toBe("pass");
    expect(check("authorship", { head: ld({ "@type": "Dentist", name: "Smile" }) }).status).toBe("warn");
  });
});

describe("about and contact", () => {
  it("finds internal about/contact pages by path or label, and mailto/tel links", () => {
    expect(check("about-contact", { body: '<a href="/hakkimizda">Biz</a><a href="tel:+905551112233">Ara</a>' }).score).toBe(3);
    expect(check("about-contact", { body: '<a href="/p/12">About us</a><a href="/p/13">Contact</a>' }).score).toBe(3);
  });

  it("ignores external pages and long sentences that merely mention the words", () => {
    const body = '<a href="https://twitter.com/about">about</a><a href="/blog/1">Read about how to contact your bank</a>';
    expect(check("about-contact", { body }).score).toBe(0);
  });
});

describe("technical", () => {
  it("checks HTTPS", () => {
    expect(check("https", { page: { finalUrl: "http://acme.test/" } }).status).toBe("fail");
  });

  it("scores response time smoothly", () => {
    expect(check("speed", { page: { responseMs: 800 } }).score).toBe(2);
    expect(ratio(check("speed", { page: { responseMs: 2000 } }))).toBeCloseTo(0.55);
    expect(ratio(check("speed", { page: { responseMs: 9000 } }))).toBeCloseTo(0.1);
  });

  it("requires meaningful alt text but skips decorative images and tracking pixels", () => {
    const body = `<img src="a.png" alt="Invoice dashboard"><img src="b.png" alt=""><img src="c.png" role="presentation">
      <img src="p.gif" width="1" height="1"><img src="d.png" alt="IMG_0042.jpg"><img src="e.png">`;
    expect(check("image-alt", { body }).detail).toBe("1/3 images have alt text.");
    expect(check("image-alt").status).toBe("pass");
  });
});

describe("product data", () => {
  it("accepts prices in a priceSpecification and products nested in a WebPage", () => {
    const head = ld({
      "@type": "ItemPage",
      mainEntity: {
        "@type": "Product", name: "Shoe", image: "/s.jpg", brand: "Acme", review: [{ "@type": "Review" }],
        offers: { "@type": "Offer", availability: "InStock", priceSpecification: { price: 49, priceCurrency: "EUR" } },
      },
    });
    expect(check("product-data", { head }).status).toBe("pass");
  });

  it("fails a product page without Product markup", () => {
    expect(check("product-data", { head: '<meta property="og:type" content="product">' }).score).toBe(0);
  });
});

describe("markdown access", () => {
  it("accepts a Markdown alternate link", () => {
    expect(check("markdown-access", { head: '<link rel="alternate" type="text/markdown" href="/index.md">' }).status).toBe("pass");
    expect(check("markdown-access", { files: { llmsFullTxt: "too short" } }).status).toBe("fail");
  });
});

describe("localisation", () => {
  it("returns Turkish text for every check", () => {
    const tr = Object.values(audit({ lang: "tr", files: { robotsUnreachable: true } }));
    const en = Object.values(audit({ files: { robotsUnreachable: true } }));
    tr.forEach((c, i) => c.id !== "https" && expect(c.title).not.toBe(en[i].title));
    expect(tr.find((c) => c.id === "ai-search-bots")!.detail).toContain("sunucu hatası");
  });
});
