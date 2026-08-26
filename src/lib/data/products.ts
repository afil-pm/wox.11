export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductCategory {
  name: string;
  gender: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  averageRating: number;
  reviewCount: number;
  images: ProductImage[];
  category: ProductCategory;
}

const img = (gender: string, category: string, slug: string, index: number, alt: string): ProductImage => ({
  url: `/images/products/${gender}/${category}/${slug}-${index}.png`,
  alt,
});

export const products: Product[] = [
  // ── Men's Shirts ──────────────────────────────────────────
  {
    id: "ms-01",
    name: "WOX Classic White Oxford Shirt",
    slug: "wox-classic-white-oxford-shirt",
    basePrice: 2499,
    salePrice: 1999,
    averageRating: 4.7,
    reviewCount: 312,
    images: [
      img("men", "shirts", "wox-classic-white-oxford-shirt", 1, "WOX Classic White Oxford Shirt front view"),
      img("men", "shirts", "wox-classic-white-oxford-shirt", 2, "WOX Classic White Oxford Shirt side view"),
    ],
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "ms-02",
    name: "WOX Premium Black Formal Shirt",
    slug: "wox-premium-black-formal-shirt",
    basePrice: 2299,
    salePrice: null,
    averageRating: 4.6,
    reviewCount: 245,
    images: [
      img("men", "shirts", "wox-premium-black-formal-shirt", 1, "WOX Premium Black Formal Shirt front view"),
      img("men", "shirts", "wox-premium-black-formal-shirt", 2, "WOX Premium Black Formal Shirt detail"),
    ],
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "ms-03",
    name: "WOX Slim Fit Blue Dress Shirt",
    slug: "wox-slim-fit-blue-dress-shirt",
    basePrice: 1999,
    salePrice: 1599,
    averageRating: 4.5,
    reviewCount: 189,
    images: [
      img("men", "shirts", "wox-slim-fit-blue-dress-shirt", 1, "WOX Slim Fit Blue Dress Shirt front view"),
      img("men", "shirts", "wox-slim-fit-blue-dress-shirt", 2, "WOX Slim Fit Blue Dress Shirt detail"),
    ],
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "ms-04",
    name: "WOX Nautical Striped Shirt",
    slug: "wox-nautical-striped-shirt",
    basePrice: 1899,
    salePrice: null,
    averageRating: 4.4,
    reviewCount: 156,
    images: [
      img("men", "shirts", "wox-nautical-striped-shirt", 1, "WOX Nautical Striped Shirt front view"),
      img("men", "shirts", "wox-nautical-striped-shirt", 2, "WOX Nautical Striped Shirt side view"),
    ],
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "ms-05",
    name: "WOX Casual Linen Check Shirt",
    slug: "wox-casual-linen-check-shirt",
    basePrice: 1799,
    salePrice: 1399,
    averageRating: 4.3,
    reviewCount: 134,
    images: [
      img("men", "shirts", "wox-casual-linen-check-shirt", 1, "WOX Casual Linen Check Shirt front view"),
      img("men", "shirts", "wox-casual-linen-check-shirt", 2, "WOX Casual Linen Check Shirt detail"),
    ],
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "ms-06",
    name: "WOX Office Fit Sage Shirt",
    slug: "wox-office-fit-sage-shirt",
    basePrice: 2199,
    salePrice: null,
    averageRating: 4.5,
    reviewCount: 98,
    images: [
      img("men", "shirts", "wox-office-fit-sage-shirt", 1, "WOX Office Fit Sage Shirt front view"),
      img("men", "shirts", "wox-office-fit-sage-shirt", 2, "WOX Office Fit Sage Shirt detail"),
    ],
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "ms-07",
    name: "WOX Regular Fit Lavender Shirt",
    slug: "wox-regular-fit-lavender-shirt",
    basePrice: 1699,
    salePrice: 1299,
    averageRating: 4.2,
    reviewCount: 87,
    images: [
      img("men", "shirts", "wox-regular-fit-lavender-shirt", 1, "WOX Regular Fit Lavender Shirt front view"),
      img("men", "shirts", "wox-regular-fit-lavender-shirt", 2, "WOX Regular Fit Lavender Shirt side view"),
    ],
    category: { name: "Shirts", gender: "men" },
  },

  // ── Men's T-Shirts ────────────────────────────────────────
  {
    id: "mt-01",
    name: "WOX Essential White Crew Neck T-Shirt",
    slug: "wox-essential-white-crew-neck-tshirt",
    basePrice: 799,
    salePrice: 599,
    averageRating: 4.6,
    reviewCount: 423,
    images: [
      img("men", "t-shirts", "wox-essential-white-crew-neck-tshirt", 1, "WOX Essential White Crew Neck T-Shirt front view"),
      img("men", "t-shirts", "wox-essential-white-crew-neck-tshirt", 2, "WOX Essential White Crew Neck T-Shirt back view"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "mt-02",
    name: "WOX Essential Black Oversized T-Shirt",
    slug: "wox-essential-black-oversized-tshirt",
    basePrice: 999,
    salePrice: 799,
    averageRating: 4.7,
    reviewCount: 389,
    images: [
      img("men", "t-shirts", "wox-essential-black-oversized-tshirt", 1, "WOX Essential Black Oversized T-Shirt front view"),
      img("men", "t-shirts", "wox-essential-black-oversized-tshirt", 2, "WOX Essential Black Oversized T-Shirt detail"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "mt-03",
    name: "WOX Classic White Basic Tee",
    slug: "wox-classic-white-basic-tee",
    basePrice: 699,
    salePrice: null,
    averageRating: 4.4,
    reviewCount: 267,
    images: [
      img("men", "t-shirts", "wox-classic-white-basic-tee", 1, "WOX Classic White Basic Tee front view"),
      img("men", "t-shirts", "wox-classic-white-basic-tee", 2, "WOX Classic White Basic Tee back view"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "mt-04",
    name: "WOX Trio Pack Essential Tees",
    slug: "wox-trio-pack-essential-tees",
    basePrice: 1499,
    salePrice: 1199,
    averageRating: 4.5,
    reviewCount: 201,
    images: [
      img("men", "t-shirts", "wox-trio-pack-essential-tees", 1, "WOX Trio Pack Essential Tees front view"),
      img("men", "t-shirts", "wox-trio-pack-essential-tees", 2, "WOX Trio Pack Essential Tees detail"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "mt-05",
    name: "WOX Sport Polo Shirt",
    slug: "wox-sport-polo-shirt",
    basePrice: 1299,
    salePrice: null,
    averageRating: 4.3,
    reviewCount: 178,
    images: [
      img("men", "t-shirts", "wox-sport-polo-shirt", 1, "WOX Sport Polo Shirt front view"),
      img("men", "t-shirts", "wox-sport-polo-shirt", 2, "WOX Sport Polo Shirt detail"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "mt-06",
    name: "WOX Relaxed Fit Grey Tee",
    slug: "wox-relaxed-fit-grey-tee",
    basePrice: 899,
    salePrice: 699,
    averageRating: 4.4,
    reviewCount: 156,
    images: [
      img("men", "t-shirts", "wox-relaxed-fit-grey-tee", 1, "WOX Relaxed Fit Grey Tee front view"),
      img("men", "t-shirts", "wox-relaxed-fit-grey-tee", 2, "WOX Relaxed Fit Grey Tee detail"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "mt-07",
    name: "WOX Premium Navy Polo",
    slug: "wox-premium-navy-polo",
    basePrice: 1499,
    salePrice: null,
    averageRating: 4.6,
    reviewCount: 142,
    images: [
      img("men", "t-shirts", "wox-premium-navy-polo", 1, "WOX Premium Navy Polo front view"),
      img("men", "t-shirts", "wox-premium-navy-polo", 2, "WOX Premium Navy Polo detail"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },

  // ── Men's Pants ───────────────────────────────────────────
  {
    id: "mp-01",
    name: "WOX Slim Fit Navy Chinos",
    slug: "wox-slim-fit-navy-chinos",
    basePrice: 1999,
    salePrice: 1599,
    averageRating: 4.6,
    reviewCount: 287,
    images: [
      img("men", "pants", "wox-slim-fit-navy-chinos", 1, "WOX Slim Fit Navy Chinos front view"),
      img("men", "pants", "wox-slim-fit-navy-chinos", 2, "WOX Slim Fit Navy Chinos side view"),
    ],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "mp-02",
    name: "WOX Formal Black Trousers",
    slug: "wox-formal-black-trousers",
    basePrice: 2499,
    salePrice: null,
    averageRating: 4.5,
    reviewCount: 198,
    images: [
      img("men", "pants", "wox-formal-black-trousers", 1, "WOX Formal Black Trousers front view"),
      img("men", "pants", "wox-formal-black-trousers", 2, "WOX Formal Black Trousers detail"),
    ],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "mp-03",
    name: "WOX Classic Blue Denim Jeans",
    slug: "wox-classic-blue-denim-jeans",
    basePrice: 2299,
    salePrice: 1799,
    averageRating: 4.7,
    reviewCount: 356,
    images: [
      img("men", "pants", "wox-classic-blue-denim-jeans", 1, "WOX Classic Blue Denim Jeans front view"),
      img("men", "pants", "wox-classic-blue-denim-jeans", 2, "WOX Classic Blue Denim Jeans detail"),
    ],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "mp-04",
    name: "WOX Utility Cargo Pants",
    slug: "wox-utility-cargo-pants",
    basePrice: 2199,
    salePrice: null,
    averageRating: 4.4,
    reviewCount: 167,
    images: [
      img("men", "pants", "wox-utility-cargo-pants", 1, "WOX Utility Cargo Pants front view"),
      img("men", "pants", "wox-utility-cargo-pants", 2, "WOX Utility Cargo Pants side view"),
    ],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "mp-05",
    name: "WOX Comfort Jogger Pants",
    slug: "wox-comfort-jogger-pants",
    basePrice: 1699,
    salePrice: 1199,
    averageRating: 4.5,
    reviewCount: 234,
    images: [
      img("men", "pants", "wox-comfort-jogger-pants", 1, "WOX Comfort Jogger Pants front view"),
      img("men", "pants", "wox-comfort-jogger-pants", 2, "WOX Comfort Jogger Pants detail"),
    ],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "mp-06",
    name: "WOX Slim Fit Olive Chinos",
    slug: "wox-slim-fit-olive-chinos",
    basePrice: 2099,
    salePrice: null,
    averageRating: 4.3,
    reviewCount: 112,
    images: [
      img("men", "pants", "wox-slim-fit-olive-chinos", 1, "WOX Slim Fit Olive Chinos front view"),
      img("men", "pants", "wox-slim-fit-olive-chinos", 2, "WOX Slim Fit Olive Chinos side view"),
    ],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "mp-07",
    name: "WOX Relaxed Fit Beige Trousers",
    slug: "wox-relaxed-fit-beige-trousers",
    basePrice: 2799,
    salePrice: 2199,
    averageRating: 4.6,
    reviewCount: 89,
    images: [
      img("men", "pants", "wox-relaxed-fit-beige-trousers", 1, "WOX Relaxed Fit Beige Trousers front view"),
      img("men", "pants", "wox-relaxed-fit-beige-trousers", 2, "WOX Relaxed Fit Beige Trousers detail"),
    ],
    category: { name: "Pants", gender: "men" },
  },

  // ── Boys' Shirts ──────────────────────────────────────────
  {
    id: "bs-01",
    name: "WOX Boys' Classic White Shirt",
    slug: "wox-boys-classic-white-shirt",
    basePrice: 1199,
    salePrice: 899,
    averageRating: 4.5,
    reviewCount: 145,
    images: [
      img("boys", "shirts", "wox-boys-classic-white-shirt", 1, "WOX Boys' Classic White Shirt front view"),
      img("boys", "shirts", "wox-boys-classic-white-shirt", 2, "WOX Boys' Classic White Shirt detail"),
    ],
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "bs-02",
    name: "WOX Boys' Casual Print Shirt",
    slug: "wox-boys-casual-print-shirt",
    basePrice: 1299,
    salePrice: null,
    averageRating: 4.4,
    reviewCount: 98,
    images: [
      img("boys", "shirts", "wox-boys-casual-print-shirt", 1, "WOX Boys' Casual Print Shirt front view"),
      img("boys", "shirts", "wox-boys-casual-print-shirt", 2, "WOX Boys' Casual Print Shirt detail"),
    ],
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "bs-03",
    name: "WOX Boys' Formal Blue Shirt",
    slug: "wox-boys-formal-blue-shirt",
    basePrice: 1399,
    salePrice: 1099,
    averageRating: 4.3,
    reviewCount: 76,
    images: [
      img("boys", "shirts", "wox-boys-formal-blue-shirt", 1, "WOX Boys' Formal Blue Shirt front view"),
      img("boys", "shirts", "wox-boys-formal-blue-shirt", 2, "WOX Boys' Formal Blue Shirt detail"),
    ],
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "bs-04",
    name: "WOX Boys' Striped Casual Shirt",
    slug: "wox-boys-striped-casual-shirt",
    basePrice: 1099,
    salePrice: null,
    averageRating: 4.2,
    reviewCount: 64,
    images: [
      img("boys", "shirts", "wox-boys-striped-casual-shirt", 1, "WOX Boys' Striped Casual Shirt front view"),
      img("boys", "shirts", "wox-boys-striped-casual-shirt", 2, "WOX Boys' Striped Casual Shirt detail"),
    ],
    category: { name: "Shirts", gender: "boys" },
  },

  // ── Boys' T-Shirts ────────────────────────────────────────
  {
    id: "bt-01",
    name: "WOX Boys' Colorful Crew Neck Tee",
    slug: "wox-boys-colorful-crew-neck-tee",
    basePrice: 699,
    salePrice: 449,
    averageRating: 4.6,
    reviewCount: 198,
    images: [
      img("boys", "t-shirts", "wox-boys-colorful-crew-neck-tee", 1, "WOX Boys' Colorful Crew Neck Tee front view"),
      img("boys", "t-shirts", "wox-boys-colorful-crew-neck-tee", 2, "WOX Boys' Colorful Crew Neck Tee detail"),
    ],
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "bt-02",
    name: "WOX Boys' Graphic Print Tee",
    slug: "wox-boys-graphic-print-tee",
    basePrice: 799,
    salePrice: null,
    averageRating: 4.5,
    reviewCount: 156,
    images: [
      img("boys", "t-shirts", "wox-boys-graphic-print-tee", 1, "WOX Boys' Graphic Print Tee front view"),
      img("boys", "t-shirts", "wox-boys-graphic-print-tee", 2, "WOX Boys' Graphic Print Tee detail"),
    ],
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "bt-03",
    name: "WOX Boys' Basic White Tee",
    slug: "wox-boys-basic-white-tee",
    basePrice: 549,
    salePrice: 449,
    averageRating: 4.4,
    reviewCount: 134,
    images: [
      img("boys", "t-shirts", "wox-boys-basic-white-tee", 1, "WOX Boys' Basic White Tee front view"),
      img("boys", "t-shirts", "wox-boys-basic-white-tee", 2, "WOX Boys' Basic White Tee back view"),
    ],
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "bt-04",
    name: "WOX Boys' Sports Polo Tee",
    slug: "wox-boys-sports-polo-tee",
    basePrice: 899,
    salePrice: null,
    averageRating: 4.3,
    reviewCount: 87,
    images: [
      img("boys", "t-shirts", "wox-boys-sports-polo-tee", 1, "WOX Boys' Sports Polo Tee front view"),
      img("boys", "t-shirts", "wox-boys-sports-polo-tee", 2, "WOX Boys' Sports Polo Tee detail"),
    ],
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "bt-05",
    name: "WOX Boys' Tank Top Pack",
    slug: "wox-boys-tank-top-pack",
    basePrice: 999,
    salePrice: 799,
    averageRating: 4.2,
    reviewCount: 65,
    images: [
      img("boys", "t-shirts", "wox-boys-tank-top-pack", 1, "WOX Boys' Tank Top Pack front view"),
      img("boys", "t-shirts", "wox-boys-tank-top-pack", 2, "WOX Boys' Tank Top Pack detail"),
    ],
    category: { name: "T-Shirts", gender: "boys" },
  },

  // ── Boys' Pants ───────────────────────────────────────────
  {
    id: "bp-01",
    name: "WOX Boys' Classic Denim Jeans",
    slug: "wox-boys-classic-denim-jeans",
    basePrice: 1499,
    salePrice: 1199,
    averageRating: 4.6,
    reviewCount: 176,
    images: [
      img("boys", "pants", "wox-boys-classic-denim-jeans", 1, "WOX Boys' Classic Denim Jeans front view"),
      img("boys", "pants", "wox-boys-classic-denim-jeans", 2, "WOX Boys' Classic Denim Jeans detail"),
    ],
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "bp-02",
    name: "WOX Boys' Comfort Joggers",
    slug: "wox-boys-comfort-joggers",
    basePrice: 1199,
    salePrice: null,
    averageRating: 4.5,
    reviewCount: 143,
    images: [
      img("boys", "pants", "wox-boys-comfort-joggers", 1, "WOX Boys' Comfort Joggers front view"),
      img("boys", "pants", "wox-boys-comfort-joggers", 2, "WOX Boys' Comfort Joggers detail"),
    ],
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "bp-03",
    name: "WOX Boys' Slim Fit Chinos",
    slug: "wox-boys-slim-fit-chinos",
    basePrice: 1399,
    salePrice: 1099,
    averageRating: 4.4,
    reviewCount: 98,
    images: [
      img("boys", "pants", "wox-boys-slim-fit-chinos", 1, "WOX Boys' Slim Fit Chinos front view"),
      img("boys", "pants", "wox-boys-slim-fit-chinos", 2, "WOX Boys' Slim Fit Chinos detail"),
    ],
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "bp-04",
    name: "WOX Boys' Cargo Shorts",
    slug: "wox-boys-cargo-shorts",
    basePrice: 999,
    salePrice: 799,
    averageRating: 4.3,
    reviewCount: 87,
    images: [
      img("boys", "pants", "wox-boys-cargo-shorts", 1, "WOX Boys' Cargo Shorts front view"),
      img("boys", "pants", "wox-boys-cargo-shorts", 2, "WOX Boys' Cargo Shorts detail"),
    ],
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "bp-05",
    name: "WOX Boys' Track Pants",
    slug: "wox-boys-track-pants",
    basePrice: 1299,
    salePrice: null,
    averageRating: 4.4,
    reviewCount: 72,
    images: [
      img("boys", "pants", "wox-boys-track-pants", 1, "WOX Boys' Track Pants front view"),
      img("boys", "pants", "wox-boys-track-pants", 2, "WOX Boys' Track Pants detail"),
    ],
    category: { name: "Pants", gender: "boys" },
  },
];

export function getProductsByCategory(
  gender: string,
  category?: string
): Product[] {
  return products.filter(
    (p) =>
      p.category.gender === gender &&
      (category ? p.category.name === category : true)
  );
}

export function getFeaturedProducts(): Product[] {
  return [...products]
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 8);
}

export function getNewArrivals(): Product[] {
  return products.slice(0, 8);
}

export function getBestSellers(): Product[] {
  return [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 8);
}
