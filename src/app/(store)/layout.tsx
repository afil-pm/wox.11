import { Suspense } from "react";
import Header from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import BottomNav from "@/components/layout/bottom-nav";
import StoreProviders from "@/components/layout/store-providers";
import JsonLd from "@/components/seo/json-ld";
import { generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seo";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProviders>
      <JsonLd data={generateOrganizationSchema()} />
      <JsonLd data={generateWebsiteSchema()} />
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <Suspense>
        <BottomNav />
      </Suspense>
    </StoreProviders>
  );
}
