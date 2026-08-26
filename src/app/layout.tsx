import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
  },
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
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
