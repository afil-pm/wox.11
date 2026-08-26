import { Suspense } from "react";
import Header from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import BottomNav from "@/components/layout/bottom-nav";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <Suspense>
        <BottomNav />
      </Suspense>
    </>
  );
}
