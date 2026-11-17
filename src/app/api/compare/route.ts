import { NextResponse } from "next/server";
import { UnsafeUrlError, localizedUrlError } from "@/lib/audit";
import { cachedAudit } from "@/lib/audit/cached";
import { compareSites, MAX_COMPETITORS } from "@/lib/compare";
import { isLang, pickLang } from "@/lib/i18n";
import { clientKey, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { url, competitors: [{ url, name? }] | ["rival.com", ...], lang? }
 * Audits your site and up to three competitors and returns the gaps between them.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { url?: unknown; competitors?: unknown; lang?: unknown };
  const lang = isLang(body.lang) ? body.lang : pickLang(req.headers.get("accept-language"));
  const tr = lang === "tr";

  if (typeof body.url !== "string" || !Array.isArray(body.competitors)) {
    return NextResponse.json(
      { error: tr ? 'Şöyle bir JSON gönderin: {"url": "siteniz.com", "competitors": ["rakip.com"]}' : 'Send {"url": "you.com", "competitors": ["rival.com"]}.' },
      { status: 400 },
    );
  }
  // Each comparison audits up to four sites, so it has its own, smaller hourly budget.
  if (!rateLimit(`compare:${clientKey(req)}`, 5).ok) {
    return NextResponse.json(
      { error: tr ? "Saatlik karşılaştırma sınırına ulaştınız. Biraz sonra tekrar deneyin." : "Hourly comparison limit reached. Try again later." },
      { status: 429 },
    );
  }

  const competitors = body.competitors
    .slice(0, MAX_COMPETITORS * 2)
    .map((c) => (typeof c === "string" ? { url: c } : c && typeof c === "object" ? (c as { url?: unknown; name?: unknown }) : null))
    .filter((c): c is { url: string; name?: unknown } => !!c && typeof c.url === "string")
    .map((c) => ({ url: c.url.slice(0, 200), name: typeof c.name === "string" ? c.name.slice(0, 80) : undefined }));

  try {
    const report = await compareSites(body.url, competitors, { lang, audit: cachedAudit });
    return NextResponse.json(report);
  } catch (err) {
    if (err instanceof UnsafeUrlError) return NextResponse.json({ error: localizedUrlError(err, lang) }, { status: 400 });
    if (err instanceof Error && err.message.startsWith("Add at least one")) {
      return NextResponse.json({ error: tr ? "Kendi sitenizden farklı en az bir rakip sitesi girin." : err.message }, { status: 400 });
    }
    return NextResponse.json({ error: tr ? "Sitenize ulaşılamadı." : "Could not fetch your site." }, { status: 502 });
  }
}
