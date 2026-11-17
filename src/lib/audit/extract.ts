import * as cheerio from "cheerio";

export type Doc = cheerio.CheerioAPI;

export function load(html: string): Doc {
  return cheerio.load(html);
}

type Node = Record<string, unknown>;

/** Strips the wrappers CMSs often leave around JSON-LD: HTML comments, CDATA and trailing semicolons. */
function cleanJsonLd(raw: string): string {
  return raw
    .trim()
    .replace(/^<!--/, "")
    .replace(/-->$/, "")
    .replace(/^\/\/\s*<!\[CDATA\[/, "")
    .replace(/\/\/\s*\]\]>$/, "")
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim()
    .replace(/;$/, "");
}

/** Keys whose typed values describe a separate entity that crawlers treat as its own node. */
const ENTITY_KEYS = ["@graph", "mainEntity", "mainEntityOfPage", "about", "itemReviewed", "publisher", "author"];
/** Types that only make sense inside their parent (a FAQ's questions), so they are not entities of their own. */
const INNER_TYPES = new Set(["Question", "Answer", "ListItem", "Offer", "AggregateOffer", "PropertyValue", "ImageObject"]);

/**
 * Parses every JSON-LD block and returns its entities: top-level nodes, @graph members and typed
 * entities nested under keys such as mainEntity (e.g. WebPage → Product). Invalid blocks are skipped.
 */
export function jsonLdNodes($: Doc): Node[] {
  const nodes: Node[] = [];
  const seen = new Set<Node>();
  $('script[type="application/ld+json" i]').each((_, el) => {
    let data: unknown;
    try {
      data = JSON.parse(cleanJsonLd($(el).text()));
    } catch {
      return; // malformed JSON-LD
    }
    const queue: unknown[] = Array.isArray(data) ? [...data] : [data];
    while (queue.length) {
      const n = queue.shift();
      if (!n || typeof n !== "object" || Array.isArray(n) || seen.has(n as Node)) continue;
      const node = n as Node;
      seen.add(node);
      nodes.push(node);
      for (const key of ENTITY_KEYS) {
        for (const child of [node[key]].flat()) {
          if (!child || typeof child !== "object") continue;
          const types = typesOf(child as Node);
          if (key === "@graph" || (types.length > 0 && !types.some((t) => INNER_TYPES.has(t)))) queue.push(child);
        }
      }
    }
  });
  return nodes;
}

/** A node's @type values without a schema.org prefix ("https://schema.org/Product" → "Product"). */
export function typesOf(node: Node): string[] {
  return [node["@type"]]
    .flat()
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map((v) => v.trim().replace(/^(https?:\/\/schema\.org\/|schema:)/i, ""));
}

export function schemaTypes(nodes: Node[]): string[] {
  return [...new Set(nodes.flatMap(typesOf))];
}

export function nodesOfType(nodes: Node[], type: string): Node[] {
  return nodes.filter((n) => typesOf(n).includes(type));
}

/** Elements a crawler would not show as content: code, embeds and anything hidden from readers. */
const HIDDEN = [
  "script", "style", "noscript", "template", "svg", "iframe", "object",
  "[hidden]", '[aria-hidden="true"]', '[style*="display:none" i]', '[style*="display: none" i]',
  '[style*="visibility:hidden" i]', '[style*="visibility: hidden" i]',
].join(", ");

/** Visible text as a crawler without JavaScript would see it. Hidden text does not count. */
export function visibleText($: Doc): string {
  const body = $("body").clone();
  body.find(HIDDEN).remove();
  // Block elements end words: "<p>a</p><p>b</p>" is two words, not "ab".
  body.find("p, div, li, td, th, h1, h2, h3, h4, h5, h6, br, section, article, dt, dd").each((_, el) => {
    $(el).after(" ");
  });
  return body.text().replace(/\s+/g, " ").trim();
}

const isWord = (w: string) => /[\p{L}\p{N}]/u.test(w);

export function wordCount(text: string): number {
  return text ? text.split(" ").filter(isWord).length : 0;
}

/** Distinct words, case-folded and stripped of punctuation. Repeating one phrase does not raise it. */
export function uniqueWordCount(text: string): number {
  if (!text) return 0;
  const words = text
    .toLocaleLowerCase()
    .split(" ")
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(isWord);
  return new Set(words).size;
}

/** Reads a meta tag by name or property, ignoring case ("Description" works too). */
export function meta($: Doc, name: string): string | null {
  const v =
    $(`meta[name="${name}" i]`).attr("content") ?? $(`meta[property="${name}" i]`).attr("content");
  return v?.trim() || null;
}
