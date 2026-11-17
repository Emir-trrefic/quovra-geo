import { describe, expect, it } from "vitest";
import { cachedAudit } from "@/lib/audit/cached";
import { fetchPage, fetchText, looksLikeHtmlPage } from "@/lib/audit/fetcher";
import { UnsafeUrlError } from "@/lib/audit/ssrf";

/** A fetch stand-in that answers each request with the next scripted response. */
function scripted(...responses: (() => Response)[]): { fetchImpl: typeof fetch; calls: string[] } {
  const calls: string[] = [];
  const fetchImpl = (async (input: string | URL) => {
    calls.push(input.toString());
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    return next();
  }) as typeof fetch;
  return { fetchImpl, calls };
}
const redirect = (to: string) => () => new Response(null, { status: 301, headers: { location: to } });
const ok = (body: string) => () => new Response(body, { status: 200, headers: { "content-type": "text/html" } });

describe("fetchPage", () => {
  it("follows relative redirects and reports the final URL", async () => {
    const { fetchImpl, calls } = scripted(redirect("/en/"), redirect("https://www.acme.test/en/"), ok("<html>hi</html>"));
    const page = await fetchPage(new URL("https://acme.test/"), { fetchImpl, skipHostCheck: true });
    expect(calls).toEqual(["https://acme.test/", "https://acme.test/en/", "https://www.acme.test/en/"]);
    expect(page.finalUrl).toBe("https://www.acme.test/en/");
    expect(page.url).toBe("https://acme.test/");
    expect(page.html).toBe("<html>hi</html>");
    expect(page.headers["content-type"]).toBe("text/html");
  });

  it("refuses redirects to other protocols", async () => {
    const { fetchImpl } = scripted(redirect("file:///etc/passwd"));
    await expect(fetchPage(new URL("https://acme.test/"), { fetchImpl, skipHostCheck: true })).rejects.toThrow(UnsafeUrlError);
  });

  it("checks every redirect hop against private addresses", async () => {
    const { fetchImpl } = scripted(redirect("http://169.254.169.254/latest/meta-data"));
    await expect(fetchPage(new URL("https://93.184.216.34/"), { fetchImpl })).rejects.toThrow(UnsafeUrlError);
  });

  it("gives up after too many redirects", async () => {
    const { fetchImpl } = scripted(...Array.from({ length: 10 }, () => redirect("/loop")));
    await expect(fetchPage(new URL("https://acme.test/"), { fetchImpl, skipHostCheck: true })).rejects.toThrow("Too many redirects");
  });

  it("caps very large bodies", async () => {
    const big = "a".repeat(4 * 1024 * 1024);
    const { fetchImpl } = scripted(ok(big));
    const page = await fetchPage(new URL("https://acme.test/"), { fetchImpl, skipHostCheck: true });
    expect(page.html.length).toBeLessThanOrEqual(3 * 1024 * 1024);
  });
});

describe("fetchText", () => {
  it("returns null for errors, non-2xx answers and HTML shells", async () => {
    const opts = (r: () => Response) => ({ ...scripted(r), skipHostCheck: true });
    expect(await fetchText(new URL("https://a.test/llms.txt"), opts(() => new Response("x", { status: 404 })))).toBeNull();
    expect(await fetchText(new URL("https://a.test/llms.txt"), opts(ok("<!DOCTYPE html><html><body>app</body></html>")))).toBeNull();
    expect(await fetchText(new URL("https://a.test/llms.txt"), opts(() => { throw new TypeError("network"); }))).toBeNull();
    expect(await fetchText(new URL("https://a.test/llms.txt"), opts(ok("# Acme")))).toBe("# Acme");
  });

  it("tells HTML pages from XML and text", () => {
    expect(looksLikeHtmlPage('<?xml version="1.0"?><urlset/>')).toBe(false);
    expect(looksLikeHtmlPage("<sitemapindex></sitemapindex>")).toBe(false);
    expect(looksLikeHtmlPage("  <html><head></head></html>")).toBe(true);
    expect(looksLikeHtmlPage("# Title\n\nUse <html> tags")).toBe(false);
  });
});

describe("cachedAudit", () => {
  it("serves repeated audits of the same URL from cache", async () => {
    let n = 0;
    const fetchImpl = (async () => {
      n++;
      return new Response("<html><body>Hi</body></html>", { status: 200, headers: { "content-type": "text/html" } });
    }) as typeof fetch;
    const a = await cachedAudit("cache-test.test", { fetchImpl, skipHostCheck: true });
    const calls = n;
    const b = await cachedAudit("https://cache-test.test/", { fetchImpl, skipHostCheck: true });
    expect(b).toBe(a);
    expect(n).toBe(calls);
  });
});
