import "../globals.css";
import { buildMetadata } from "@/lib/site";
import { mono, sans } from "../fonts";

export const metadata = buildMetadata("tr");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
