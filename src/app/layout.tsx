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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.body;if(!d)return;var s=document.createElement('div');s.id='wox-inline-splash';s.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#fff;';s.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;gap:16px"><div style="display:flex;align-items:baseline;gap:0">\\x3Cstyle>@keyframes li{0%{opacity:0;transform:translateY(8px) scale(.9);filter:blur(4px)}100%{opacity:1;transform:none;filter:none}}@keyframes di{0%{opacity:0;transform:scale(0)}60%{opacity:1;transform:scale(1.3)}100%{opacity:1;transform:scale(1)}}@keyframes pr{0%{transform:translateX(-100%)}50%{transform:translateX(0)}100%{transform:translateX(100%)}}</style>\\x3C/div><div style="display:flex;align-items:baseline"><span style="font-size:clamp(2rem,5vw,3rem);font-weight:900;letter-spacing:-2px;color:#18181b;animation:li .5s cubic-bezier(.22,1,.36,1) both">W</span><span style="font-size:clamp(2rem,5vw,3rem);font-weight:900;letter-spacing:-2px;color:#18181b;animation:li .5s cubic-bezier(.22,1,.36,1) .12s both">O</span><span style="font-size:clamp(2rem,5vw,3rem);font-weight:900;letter-spacing:-2px;color:#18181b;animation:li .5s cubic-bezier(.22,1,.36,1) .24s both">X</span><span style="font-size:clamp(2rem,5vw,3rem);font-weight:900;letter-spacing:-2px;color:#71717a;margin-left:2px;animation:di .4s cubic-bezier(.22,1,.36,1) .48s both">.</span><span style="font-size:clamp(2rem,5vw,3rem);font-weight:900;letter-spacing:-2px;color:#18181b;animation:li .5s cubic-bezier(.22,1,.36,1) .48s both">1</span><span style="font-size:clamp(2rem,5vw,3rem);font-weight:900;letter-spacing:-2px;color:#18181b;animation:li .5s cubic-bezier(.22,1,.36,1) .6s both">1</span></div><div style="height:2px;width:96px;overflow:hidden;border-radius:999px;background:#f4f4f5"><div style="height:100%;width:100%;border-radius:999px;background:#18181b;animation:pr 1.5s ease-in-out infinite"></div></div></div>';d.prepend(s);})();`,
          }}
        />
        <PwaSplash />
        {children}
        <PWAInstallBanner />
      </body>
    </html>
  );
}
