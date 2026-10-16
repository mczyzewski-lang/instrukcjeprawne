import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConsentBar } from "@/components/layout/ConsentBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} – ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: "Krok po kroku: jakie masz możliwości w trudnej sprawie prawnej. Bez skomplikowanego języka prawniczego. Bezpłatnie.",
  applicationName: SITE_NAME,
  openGraph: { type: "website", locale: "pl_PL", siteName: SITE_NAME },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#14233E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="flex min-h-dvh flex-col">
        <a href="#tresc" className="skip-link">
          Przejdź do treści
        </a>
        <SiteHeader />
        <main id="tresc" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <ConsentBar />
      </body>
    </html>
  );
}
