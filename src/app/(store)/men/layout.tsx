import { Metadata } from "next";
import { generateGenderMetadata, generateBreadcrumbSchema, SITE_URL } from "@/lib/seo";
import JsonLd from "@/components/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  return generateGenderMetadata("men");
}

export default function MenLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={generateBreadcrumbSchema([
        { name: "Home", url: SITE_URL },
        { name: "Men", url: `${SITE_URL}/men` },
      ])} />
      {children}
    </>
  );
}
