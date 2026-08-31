import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PWAInstallBanner } from "@/components/ui/pwa-install-banner";
import PwaSplash from "@/components/ui/pwa-splash";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wox11.vercel.app"),
  title: "WOX.11 | Modern Essentials for Men & Boys",
  description:
    "Premium men's and boys fashion. Shop shirts, t-shirts, and pants crafted for the modern wardrobe.",
  keywords: [
    "men's fashion",
    "boys fashion",
    "shirts",
    "t-shirts",
    "pants",
    "premium clothing",
  ],
  openGraph: {
    title: "WOX.11 | Modern Essentials for Men & Boys",
    description:
      "Premium men's and boys fashion. Shop shirts, t-shirts, and pants crafted for the modern wardrobe.",
    siteName: "WOX.11",
    url: "https://wox11.vercel.app",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1024,
        height: 1024,
        alt: "WOX.11 - Modern Essentials for Men & Boys",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WOX.11 | Modern Essentials for Men & Boys",
    description:
      "Premium men's and boys fashion. Shop shirts, t-shirts, and pants crafted for the modern wardrobe.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1024,
        height: 1024,
        alt: "WOX.11 - Modern Essentials for Men & Boys",
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WOX.11",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icons/icon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="application-name" content="WOX.11" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen flex flex-col">
        <PwaSplash />
        {children}
        <PWAInstallBanner />
      </body>
    </html>
  );
}
