import { Metadata, ResolvingMetadata } from "next";
import { generateGenderMetadata, generateBreadcrumbSchema, SITE_URL } from "@/lib/seo";
import { parentOgImage } from "@/lib/seo-settings";
import JsonLd from "@/components/seo/json-ld";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return generateGenderMetadata("men", parentOgImage(await parent));
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
