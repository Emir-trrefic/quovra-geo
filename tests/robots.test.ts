import { describe, expect, it } from "vitest";
import { analyzeBots, isAllowed, parseRobots, sitemapsFromRobots } from "@/lib/audit/robots";

describe("robots.txt evaluation", () => {
  const txt = `
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
User-agent: CCBot
Disallow: /private
Allow: /private/public

User-agent: *
Disallow: /admin
Sitemap: https://x.test/sitemap.xml
`;
  const groups = parseRobots(txt);

  it("blocks agents with Disallow: /", () => {
    expect(isAllowed(groups, "GPTBot")).toBe(false);
  });

  it("supports multiple user-agents per group and longest-match rules", () => {
    expect(isAllowed(groups, "ClaudeBot", "/")).toBe(true);
    expect(isAllowed(groups, "CCBot", "/private/x")).toBe(false);
    expect(isAllowed(groups, "CCBot", "/private/public/x")).toBe(true);
  });

  it("falls back to the * group", () => {
    expect(isAllowed(groups, "PerplexityBot", "/")).toBe(true);
    expect(isAllowed(groups, "PerplexityBot", "/admin")).toBe(false);
  });

  it("treats a missing robots.txt as allow-all", () => {
    expect(analyzeBots(null).every((b) => b.allowed)).toBe(true);
  });

  it("supports wildcards and end anchors", () => {
    const g = parseRobots("User-agent: *\nDisallow: /*.pdf$");
    expect(isAllowed(g, "x", "/a/file.pdf")).toBe(false);
    expect(isAllowed(g, "x", "/a/file.pdf?x")).toBe(true);
  });

  it("extracts sitemaps", () => {
    expect(sitemapsFromRobots(txt)).toEqual(["https://x.test/sitemap.xml"]);
  });

  it("reads files with a BOM and old Mac line endings", () => {
    const g = parseRobots("\uFEFFUser-agent: GPTBot\rDisallow: /\r");
    expect(isAllowed(g, "GPTBot")).toBe(false);
  });

  it("matches user-agent product tokens with versions", () => {
    expect(isAllowed(parseRobots("User-agent: GPTBot/1.2\nDisallow: /"), "GPTBot")).toBe(false);
  });

  it("does not let a longer bot name match a shorter one", () => {
    const g = parseRobots("User-agent: Googlebot-News\nDisallow: /");
    expect(isAllowed(g, "Googlebot")).toBe(true);
  });

  it("merges repeated groups for the same agent", () => {
    const g = parseRobots("User-agent: ClaudeBot\nDisallow: /a\n\nUser-agent: ClaudeBot\nDisallow: /b");
    expect(isAllowed(g, "ClaudeBot", "/a")).toBe(false);
    expect(isAllowed(g, "ClaudeBot", "/b")).toBe(false);
    expect(isAllowed(g, "ClaudeBot", "/c")).toBe(true);
  });

  it("lets Allow win a tie and ignores rules before any user-agent", () => {
    const g = parseRobots("Disallow: /\nUser-agent: *\nDisallow: /x\nAllow: /x");
    expect(isAllowed(g, "any", "/x")).toBe(true);
    expect(isAllowed(g, "any", "/")).toBe(true);
  });

  it("compares percent-encoded and plain paths", () => {
    const g = parseRobots("User-agent: *\nDisallow: /%7Euser");
    expect(isAllowed(g, "x", "/~user/page")).toBe(false);
  });

  it("disallows every bot when robots.txt is unreachable", () => {
    expect(analyzeBots("User-agent: *\nAllow: /", true).some((b) => b.allowed)).toBe(false);
  });

  it("de-duplicates sitemaps and accepts spaces before the colon", () => {
    expect(sitemapsFromRobots("Sitemap : https://x.test/a.xml\nsitemap: https://x.test/a.xml")).toEqual(["https://x.test/a.xml"]);
    expect(sitemapsFromRobots(null)).toEqual([]);
  });
});
