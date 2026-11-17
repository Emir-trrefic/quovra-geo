import "../globals.css";
import { NAV_TRANSITION_SCRIPT } from "@/lib/navTransition";
import { buildMetadata } from "@/lib/site";
import { mono, sans } from "../fonts";

export const metadata = buildMetadata("tr");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${sans.variable} ${mono.variable}`}>
      <head>
        <style>{"@view-transition { navigation: auto; }"}</style>
        <script dangerouslySetInnerHTML={{ __html: NAV_TRANSITION_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
