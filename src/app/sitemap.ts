import type { MetadataRoute } from "next";
import { connectMongoDB } from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Category from "@/lib/models/category";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wox11.vercel.app";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/men`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/boys`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/new-arrivals`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/best-sellers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/size-guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/refund-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/shipping-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/returns`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const subcategoryPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/men/shirts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/men/t-shirts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/men/pants`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/boys/shirts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/boys/t-shirts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/boys/pants`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  let productPages: MetadataRoute.Sitemap = [];

  try {
    await connectMongoDB();

    const products = await Product.find({ isActive: true })
      .select("slug categoryId updatedAt seo.noindex")
      .populate("categoryId", "slug gender")
      .lean() as unknown as {
        slug: string;
        updatedAt: Date;
        categoryId: { slug: string; gender: string } | null;
        seo?: { noindex?: boolean };
      }[];

    productPages = products
      .filter((p) => p.categoryId && !p.seo?.noindex)
      .map((p) => ({
        url: `${baseUrl}/${p.categoryId!.gender}/${p.categoryId!.slug}/${p.slug}`,
        lastModified: p.updatedAt instanceof Date ? p.updatedAt : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch (error) {
    console.error("Sitemap: Failed to fetch products:", error);
  }

  return [...staticPages, ...subcategoryPages, ...productPages];
}
