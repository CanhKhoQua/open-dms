import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// App-wide type system, wired through the --font-sans / --font-mono CSS vars
// that tailwind.config.ts maps font-sans / font-mono to.
const fontSans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Open DMS",
  description:
    "Open, ERP-agnostic Distribution Management System — field sales, GPS check-in, order taking, and self-contained accounts receivable.",
};

export const viewport: Viewport = {
  themeColor: "#0e9a9a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
