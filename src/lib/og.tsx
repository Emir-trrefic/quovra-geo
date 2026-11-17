import { ImageResponse } from "next/og";
import type { Lang } from "./i18n";
import { LANDING } from "./i18n/landing";

export const OG_SIZE = { width: 1200, height: 630 };

/** Share image: deep midnight ground, a cobalt glow, white type and a cyan dot, matching the site. */
export function ogImage(lang: Lang) {
  const t = LANDING[lang].hero;
  const accent = "#5ee0ff";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "72px 80px", background: "radial-gradient(ellipse at 78% 0%, rgba(47,107,255,0.42), rgba(6,9,19,0) 62%), #060913", color: "#f2f5fb" }}>
        <div style={{ display: "flex", alignItems: "flex-start", fontSize: 48, fontWeight: 700, letterSpacing: -2 }}>
          quovra
          <div style={{ width: 10, height: 10, borderRadius: 9999, background: accent, marginLeft: 4, marginTop: 6 }} />
        </div>
        <div style={{ display: "flex", marginTop: 72, fontSize: 64, lineHeight: 1.1, letterSpacing: -2, fontWeight: 600, maxWidth: 1000 }}>
          {t.title}
        </div>
        <div style={{ display: "flex", marginTop: "auto", paddingTop: 24, borderTop: "1px solid #1b2744", fontSize: 22, letterSpacing: 2, color: "#a3b0c8" }}>
          {"22 CHECKS  ·  14 AI AGENTS  ·  95% CONFIDENCE INTERVALS  ·  AGPL-3.0"}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
