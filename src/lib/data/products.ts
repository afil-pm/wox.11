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

const img = (photoId: string, alt: string): ProductImage => ({
  url: `https://images.unsplash.com/photo-${photoId}?w=600&h=800&fit=crop&auto=format`,
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
      img("1602810318383-e386cc2a3ccf", "WOX Classic White Oxford Shirt front view"),
      img("1507680434567-5739c80be1ac", "WOX Classic White Oxford Shirt side view"),
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
      img("1507680434567-5739c80be1ac", "WOX Premium Black Formal Shirt front view"),
      img("1602810318383-e386cc2a3ccf", "WOX Premium Black Formal Shirt detail"),
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
      img("1624835567150-0c530a20d8cc", "WOX Slim Fit Blue Dress Shirt front view"),
      img("1594938291221-94f18cbb5660", "WOX Slim Fit Blue Dress Shirt detail"),
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
      img("1594938291221-94f18cbb5660", "WOX Nautical Striped Shirt front view"),
      img("1624835567150-0c530a20d8cc", "WOX Nautical Striped Shirt side view"),
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
      img("1626557981101-aae6f84aa6ff", "WOX Casual Linen Check Shirt front view"),
      img("1602810318383-e386cc2a3ccf", "WOX Casual Linen Check Shirt detail"),
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
      img("1624835567150-0c530a20d8cc", "WOX Office Fit Sage Shirt front view"),
      img("1507680434567-5739c80be1ac", "WOX Office Fit Sage Shirt detail"),
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
      img("1507680434567-5739c80be1ac", "WOX Regular Fit Lavender Shirt front view"),
      img("1624835567150-0c530a20d8cc", "WOX Regular Fit Lavender Shirt side view"),
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
      img("1521572163474-6864f9cf17ab", "WOX Essential White Crew Neck T-Shirt front view"),
      img("1581655353564-df123a1eb820", "WOX Essential White Crew Neck T-Shirt back view"),
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
      img("1583743814966-8936f5b7be1a", "WOX Essential Black Oversized T-Shirt front view"),
      img("1521572163474-6864f9cf17ab", "WOX Essential Black Oversized T-Shirt detail"),
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
      img("1581655353564-df123a1eb820", "WOX Classic White Basic Tee front view"),
      img("1521572163474-6864f9cf17ab", "WOX Classic White Basic Tee back view"),
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
      img("1716951848908-8907bb6c655b", "WOX Trio Pack Essential Tees front view"),
      img("1521572163474-6864f9cf17ab", "WOX Trio Pack Essential Tees detail"),
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
      img("1602810320073-1230c46d89d4", "WOX Sport Polo Shirt front view"),
      img("1583743814966-8936f5b7be1a", "WOX Sport Polo Shirt detail"),
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
      img("1581655353564-df123a1eb820", "WOX Relaxed Fit Grey Tee front view"),
      img("1583743814966-8936f5b7be1a", "WOX Relaxed Fit Grey Tee detail"),
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
      img("1602810320073-1230c46d89d4", "WOX Premium Navy Polo front view"),
      img("1521572163474-6864f9cf17ab", "WOX Premium Navy Polo detail"),
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
      img("1473966968600-fa801b869a1a", "WOX Slim Fit Navy Chinos front view"),
      img("1624378439575-d8705ad7ae80", "WOX Slim Fit Navy Chinos side view"),
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
      img("1624378439575-d8705ad7ae80", "WOX Formal Black Trousers front view"),
      img("1473966968600-fa801b869a1a", "WOX Formal Black Trousers detail"),
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
      img("1542272604-787c3835535d", "WOX Classic Blue Denim Jeans front view"),
      img("1624378439575-d8705ad7ae80", "WOX Classic Blue Denim Jeans detail"),
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
      img("1624378439575-d8705ad7ae80", "WOX Utility Cargo Pants front view"),
      img("1473966968600-fa801b869a1a", "WOX Utility Cargo Pants side view"),
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
      img("1552902865-b72c031ac5ea", "WOX Comfort Jogger Pants front view"),
      img("1624378439575-d8705ad7ae80", "WOX Comfort Jogger Pants detail"),
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
      img("1473966968600-fa801b869a1a", "WOX Slim Fit Olive Chinos front view"),
      img("1624378439575-d8705ad7ae80", "WOX Slim Fit Olive Chinos side view"),
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
      img("1624378439575-d8705ad7ae80", "WOX Relaxed Fit Beige Trousers front view"),
      img("1473966968600-fa801b869a1a", "WOX Relaxed Fit Beige Trousers detail"),
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
      img("1503944583220-79d8926ad5e2", "WOX Boys' Classic White Shirt front view"),
      img("1519238263530-99bdd11df2ea", "WOX Boys' Classic White Shirt detail"),
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
      img("1519238263530-99bdd11df2ea", "WOX Boys' Casual Print Shirt front view"),
      img("1503944583220-79d8926ad5e2", "WOX Boys' Casual Print Shirt detail"),
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
      img("1503944583220-79d8926ad5e2", "WOX Boys' Formal Blue Shirt front view"),
      img("1519238263530-99bdd11df2ea", "WOX Boys' Formal Blue Shirt detail"),
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
      img("1519238263530-99bdd11df2ea", "WOX Boys' Striped Casual Shirt front view"),
      img("1503944583220-79d8926ad5e2", "WOX Boys' Striped Casual Shirt detail"),
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
      img("1519238263530-99bdd11df2ea", "WOX Boys' Colorful Crew Neck Tee front view"),
      img("1503944583220-79d8926ad5e2", "WOX Boys' Colorful Crew Neck Tee detail"),
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
      img("1503944583220-79d8926ad5e2", "WOX Boys' Graphic Print Tee front view"),
      img("1519238263530-99bdd11df2ea", "WOX Boys' Graphic Print Tee detail"),
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
      img("1519238263530-99bdd11df2ea", "WOX Boys' Basic White Tee front view"),
      img("1503944583220-79d8926ad5e2", "WOX Boys' Basic White Tee back view"),
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
      img("1503944583220-79d8926ad5e2", "WOX Boys' Sports Polo Tee front view"),
      img("1519238263530-99bdd11df2ea", "WOX Boys' Sports Polo Tee detail"),
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
      img("1519238263530-99bdd11df2ea", "WOX Boys' Tank Top Pack front view"),
      img("1503944583220-79d8926ad5e2", "WOX Boys' Tank Top Pack detail"),
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
      img("1519238263530-99bdd11df2ea", "WOX Boys' Classic Denim Jeans front view"),
      img("1542272604-787c3835535d", "WOX Boys' Classic Denim Jeans detail"),
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
      img("1552902865-b72c031ac5ea", "WOX Boys' Comfort Joggers front view"),
      img("1519238263530-99bdd11df2ea", "WOX Boys' Comfort Joggers detail"),
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
      img("1519238263530-99bdd11df2ea", "WOX Boys' Slim Fit Chinos front view"),
      img("1473966968600-fa801b869a1a", "WOX Boys' Slim Fit Chinos detail"),
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
      img("1624378439575-d8705ad7ae80", "WOX Boys' Cargo Shorts front view"),
      img("1519238263530-99bdd11df2ea", "WOX Boys' Cargo Shorts detail"),
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
      img("1552902865-b72c031ac5ea", "WOX Boys' Track Pants front view"),
      img("1519238263530-99bdd11df2ea", "WOX Boys' Track Pants detail"),
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
