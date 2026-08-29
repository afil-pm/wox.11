import { Metadata } from "next";
import { connectMongoDB } from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Category from "@/lib/models/category";
import { generateProductMetadata, generateProductSchema, generateBreadcrumbSchema, SITE_URL, ProductSeoData } from "@/lib/seo";
import JsonLd from "@/components/seo/json-ld";

const SITE_NAME = "WOX.11";

async function getProduct(slug: string) {
  try {
    await connectMongoDB();
    const product = await Product.findOne({ slug }).lean() as unknown as {
      _id: string; name: string; slug: string; description: string;
      basePrice: number; salePrice: number; sku: string;
      images: { url: string; alt: string }[];
      averageRating: number; reviewCount: number;
      categoryId: string; seo: Record<string, unknown>;
    } | null;
    if (!product) return null;

    const category = await Category.findById(product.categoryId).lean() as unknown as {
      name: string; slug: string; gender: string;
    } | null;

    return { ...product, category };
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string; slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: "Product Not Found | WOX.11" };
  }

  return generateProductMetadata({
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: product.basePrice,
    salePrice: product.salePrice,
    sku: product.sku,
    images: product.images,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    categoryName: product.category?.name || "Products",
    categorySlug: product.category?.slug || "products",
    gender: product.category?.gender || "boys",
    seo: product.seo as ProductSeoData["seo"],
  });
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ category: string; slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  let schemas: object[] = [];

  if (product) {
    const productSchema = generateProductSchema({
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: product.basePrice,
      salePrice: product.salePrice,
      sku: product.sku,
      images: product.images,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      categoryName: product.category?.name || "Products",
      categorySlug: product.category?.slug || "products",
      gender: product.category?.gender || "boys",
    });
    schemas.push(productSchema);

    const breadcrumbs = generateBreadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: product.category?.gender === "men" ? "Men" : "Boys", url: `${SITE_URL}/${product.category?.gender || "boys"}` },
      { name: product.category?.name || "Products", url: `${SITE_URL}/${product.category?.gender || "boys"}/${product.category?.slug || "products"}` },
      { name: product.name, url: `${SITE_URL}/${product.category?.gender || "boys"}/${product.category?.slug || "products"}/${product.slug}` },
    ]);
    schemas.push(breadcrumbs);
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      {children}
    </>
  );
}
