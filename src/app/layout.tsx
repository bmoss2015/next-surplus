import type { Metadata } from "next";
import "./globals.css";
import { CookieConsent } from "@/components/legal/CookieConsent";

export const metadata: Metadata = {
  title: "Next Surplus",
  description: "Surplus funds recovery operations portal",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Next Surplus",
    description: "Operations Platform For Surplus Recovery",
    url: "https://nextsurplus.com",
    images: [{ url: "https://nextsurplus.com/og-image.png", width: 1200, height: 630 }],
  },
};

// Inter + JetBrains Mono are loaded from Google Fonts portal-wide so the
// exact same Inter face (with all weights 400-800 and the OpenType
// variants the Settings page uses) is available on every page. Earlier
// we used next/font Inter which only loaded weights 400-600 and was
// served from a different pipeline — that's why /settings looked subtly
// different from the rest of the portal. Now both share the Google
// Fonts CDN copy.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500&display=swap"
        />
      </head>
      <body className="min-h-full">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
