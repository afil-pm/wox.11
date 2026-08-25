import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";

export type SortOption = "newest" | "price_asc" | "price_desc" | "rating" | "popular";

interface GetProductsParams {
  page?: number;
  limit?: number;
  categorySlug?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  isActive?: boolean;
}

interface SearchProductsParams {
  query: string;
  page?: number;
  limit?: number;
}

const defaultProductInclude = {
  category: true,
  images: { orderBy: { position: "asc" as const }, take: 3 },
  variants: {
    include: {
      images: { orderBy: { position: "asc" as const }, take: 1 },
      sizes: {
        include: { inventory: true },
      },
    },
  },
} satisfies Prisma.ProductInclude;

function buildSortClause(sort: SortOption): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { salePrice: "asc" };
    case "price_desc":
      return { salePrice: "desc" };
    case "rating":
      return { averageRating: "desc" };
    case "popular":
      return { reviewCount: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

/**
 * Get products with filtering, sorting, and pagination.
 * @param params - Filter, sort, and pagination parameters
 * @returns Paginated products with metadata
 */
export async function getProducts(params: GetProductsParams = {}) {
  const {
    page = 1,
    limit = 12,
    categorySlug,
    gender,
    minPrice,
    maxPrice,
    sort = "newest",
    isActive = true,
  } = params;

  const where: Prisma.ProductWhereInput = { isActive };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  } else if (gender) {
    where.category = { gender };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.OR = [
      { salePrice: { not: null, gte: minPrice, lte: maxPrice } },
      { salePrice: null, basePrice: { gte: minPrice, lte: maxPrice } },
    ];
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: defaultProductInclude,
      orderBy: buildSortClause(sort),
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a product by its slug with full details.
 * @param slug - The product slug
 * @returns Product with category, images, variants, and inventory
 */
export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      ...defaultProductInclude,
      reviews: {
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

/**
 * Get featured products.
 * @param limit - Number of products to return
 * @returns Featured products
 */
export async function getFeaturedProducts(limit: number = 8) {
  return prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    include: defaultProductInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get new arrival products (most recently created).
 * @param limit - Number of products to return
 * @returns New arrival products
 */
export async function getNewArrivals(limit: number = 8) {
  return prisma.product.findMany({
    where: { isActive: true },
    include: defaultProductInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get best-selling products (by review count as proxy for popularity).
 * @param limit - Number of products to return
 * @returns Best-selling products
 */
export async function getBestSellers(limit: number = 8) {
  return prisma.product.findMany({
    where: { isActive: true },
    include: defaultProductInclude,
    orderBy: { reviewCount: "desc" },
    take: limit,
  });
}

/**
 * Search products by name or description.
 * @param params - Search query and pagination parameters
 * @returns Matching products
 */
export async function searchProducts(params: SearchProductsParams) {
  const { query, page = 1, limit = 12 } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ],
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: defaultProductInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
