import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moss Equity Partners",
  description: "Surplus funds recovery operations portal",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
