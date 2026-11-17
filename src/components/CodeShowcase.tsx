"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { LANDING } from "@/lib/i18n/landing";
import { UI } from "@/lib/i18n/ui";
import type { Kind } from "@/lib/highlight";
import { CodeLines } from "./CodeBlock";
import { CopyButton } from "./CopyButton";

type Tab = "robots" | "llms" | "jsonld" | "api" | "cli";

const FILES: Record<Tab, { file: string; kind: Kind; code: (c: string) => string }> = {
  robots: {
    file: "robots.txt", kind: "diff",
    code: (c) => `${c}
  User-agent: *
  Allow: /

- User-agent: OAI-SearchBot
- User-agent: PerplexityBot
- Disallow: /
+ User-agent: OAI-SearchBot
+ User-agent: Claude-SearchBot
+ User-agent: PerplexityBot
+ Allow: /

  Sitemap: https://example.com/sitemap.xml`,
  },
  llms: {
    file: "llms.txt", kind: "md",
    code: (c) => `${c}
# Smile Dental

> Implant and cosmetic dentistry clinic in Istanbul.

## Key pages
- [Implants](https://example.com/implants)
- [Prices](https://example.com/prices)
- [Our doctors](https://example.com/doctors)`,
  },
  jsonld: {
    file: "index.html", kind: "json",
    code: (c) => `${c}
{
  "@context": "https://schema.org",
  "@type": "Dentist",
  "name": "Smile Dental",
  "address": "Kadıköy, Istanbul",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.8,
    "reviewCount": 212
  },
  "sameAs": ["https://instagram.com/smiledental"]
}`,
  },
  api: {
    file: "terminal", kind: "shell",
    code: (c) => `${c}
$ curl -X POST https://quovra.app/api/audit \\
    -d '{"url":"example.com","pages":10}'

{
  "score": 91,
  "grade": "A",
  "siteScore": 87,
  "checks": [ ...22 checks with detail and fix ],
  "generated": { "llmsTxt": "...", "jsonLd": "...", "robotsTxt": "..." }
}`,
  },
  cli: {
    file: "terminal", kind: "shell",
    code: (c) => `${c}
$ npm run audit -- example.com --min-score=80

  Quovra GEO audit  https://example.com/
  Score 91/100  Grade A

  PASS AI search & assistant crawlers can reach you (15/15)
  PASS Content visible without JavaScript (10/10)
  PASS Structured data (Schema.org JSON-LD) (10/10)
  WARN Freshness signals (2/4)
  PASS Product data for AI shopping agents (4/4)

# exit code 0: score ≥ 80, the deploy continues`,
  },
};

export function CodeShowcase({ lang }: { lang: Lang }) {
  const t = LANDING[lang].code;
  const labels = UI[lang].report;
  const [tab, setTab] = useState<Tab>("robots");

  const f = FILES[tab];
  const code = f.code(t.comments[tab]);

  return (
    <div className="code-win editor" data-reveal>
      <div className="code-bar">
        <span className="dots" aria-hidden><i /><i /><i /></span>
        <div className="editor-tabs" role="tablist">
          {(Object.keys(FILES) as Tab[]).map((id) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{t.tabs[id]}</button>
          ))}
        </div>
        <span className="code-file editor-file">{f.file}</span>
        <CopyButton text={code} labels={{ copy: labels.copy, copied: labels.copied }} />
      </div>
      <CodeLines key={tab} code={code} kind={f.kind} label={t.tabs[tab]} />
    </div>
  );
}
