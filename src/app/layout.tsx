import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import BottomNav from "@/components/layout/bottom-nav";
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
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
