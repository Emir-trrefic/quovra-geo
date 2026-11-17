import { Geist, Geist_Mono } from "next/font/google";

// latin-ext carries the Turkish letters (ı, İ, ş, ğ) in both families.
export const sans = Geist({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });
export const mono = Geist_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--font-mono" });
