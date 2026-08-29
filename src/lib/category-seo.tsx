import { Metadata } from "next";
import { connectMongoDB } from "@/lib/mongodb";
import Category from "@/lib/models/category";
import { generateCategoryMetadata, generateBreadcrumbSchema, SITE_URL } from "@/lib/seo";
import JsonLd from "@/components/seo/json-ld";

async function getCategory(gender: string, type: string) {
  try {
    await connectMongoDB();
    return await Category.findOne({ gender, type } as any).lean() as unknown as {
      name: string; slug: string; gender: string; type: string;
      description?: string; seo?: Record<string, unknown>;
    } | null;
  } catch {
    return null;
  }
}

export function createCategoryMetadata(gender: string, type: string) {
  return async function generateMetadata(): Promise<Metadata> {
    const category = await getCategory(gender, type);
    if (!category) {
      return { title: `${gender === "men" ? "Men's" : "Boys'"} ${type} | WOX.11` };
    }
    return generateCategoryMetadata({
      name: category.name,
      slug: category.slug,
      gender: category.gender,
      type: category.type,
      description: category.description,
      seo: category.seo as any,
    });
  };
}

export function createCategoryLayout(gender: string, type: string) {
  return async function CategoryLayout({ children }: { children: React.ReactNode }) {
    const category = await getCategory(gender, type);
    const genderLabel = gender === "men" ? "Men" : "Boys";
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    return (
      <>
        <JsonLd data={generateBreadcrumbSchema([
          { name: "Home", url: SITE_URL },
          { name: genderLabel, url: `${SITE_URL}/${gender}` },
          { name: typeLabel, url: `${SITE_URL}/${gender}/${type}` },
        ])} />
        {children}
      </>
    );
  };
}
