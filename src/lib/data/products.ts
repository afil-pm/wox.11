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
    name: "WOX Men's Green & Beige Plaid Flannel Shirt",
    slug: "wox-green-plaid-flannel-shirt",
    basePrice: 9,
    salePrice: 7,
    averageRating: 4.7,
    reviewCount: 312,
    images: [
      img("men", "shirts", "wox-green-plaid-flannel-shirt", 1, "WOX Men's Green & Beige Plaid Flannel Shirt front view"),
      img("men", "shirts", "wox-green-plaid-flannel-shirt", 2, "WOX Men's Green & Beige Plaid Flannel Shirt side view"),
    ],
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "ms-02",
    name: "WOX Men's Brown & Beige Plaid Flannel Shirt",
    slug: "wox-brown-plaid-flannel-shirt",
    basePrice: 8,
    salePrice: 6,
    averageRating: 4.6,
    reviewCount: 245,
    images: [
      img("men", "shirts", "wox-brown-plaid-flannel-shirt", 1, "WOX Men's Brown & Beige Plaid Flannel Shirt front view"),
      img("men", "shirts", "wox-brown-plaid-flannel-shirt", 2, "WOX Men's Brown & Beige Plaid Flannel Shirt detail"),
    ],
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "ms-03",
    name: "WOX Men's Rust & Black Plaid Flannel Shirt",
    slug: "wox-rust-plaid-flannel-shirt",
    basePrice: 8,
    salePrice: 5,
    averageRating: 4.5,
    reviewCount: 189,
    images: [
      img("men", "shirts", "wox-rust-plaid-flannel-shirt", 1, "WOX Men's Rust & Black Plaid Flannel Shirt front view"),
      img("men", "shirts", "wox-rust-plaid-flannel-shirt", 2, "WOX Men's Rust & Black Plaid Flannel Shirt detail"),
    ],
    category: { name: "Shirts", gender: "men" },
  },
  {
    id: "ms-04",
    name: "WOX Men's Red & Black Plaid Flannel Shirt",
    slug: "wox-red-plaid-flannel-shirt",
    basePrice: 7,
    salePrice: 5,
    averageRating: 4.4,
    reviewCount: 156,
    images: [
      img("men", "shirts", "wox-red-plaid-flannel-shirt", 1, "WOX Men's Red & Black Plaid Flannel Shirt front view"),
      img("men", "shirts", "wox-red-plaid-flannel-shirt", 2, "WOX Men's Red & Black Plaid Flannel Shirt side view"),
    ],
    category: { name: "Shirts", gender: "men" },
  },

  // ── Men's T-Shirts ────────────────────────────────────────
  {
    id: "mt-01",
    name: "WOX Men's Peach Polo Shirt",
    slug: "wox-peach-polo-shirt",
    basePrice: 5,
    salePrice: 3,
    averageRating: 4.6,
    reviewCount: 423,
    images: [
      img("men", "t-shirts", "wox-peach-polo-shirt", 1, "WOX Men's Peach Polo Shirt front view"),
      img("men", "t-shirts", "wox-peach-polo-shirt", 2, "WOX Men's Peach Polo Shirt detail"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "mt-02",
    name: "WOX Men's Lavender Polo Shirt",
    slug: "wox-lavender-polo-shirt",
    basePrice: 5,
    salePrice: 3,
    averageRating: 4.7,
    reviewCount: 389,
    images: [
      img("men", "t-shirts", "wox-lavender-polo-shirt", 1, "WOX Men's Lavender Polo Shirt front view"),
      img("men", "t-shirts", "wox-lavender-polo-shirt", 2, "WOX Men's Lavender Polo Shirt detail"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "mt-03",
    name: "WOX Men's Wine Polo Shirt",
    slug: "wox-wine-polo-shirt",
    basePrice: 6,
    salePrice: 4,
    averageRating: 4.5,
    reviewCount: 267,
    images: [
      img("men", "t-shirts", "wox-wine-polo-shirt", 1, "WOX Men's Wine Polo Shirt front view"),
      img("men", "t-shirts", "wox-wine-polo-shirt", 2, "WOX Men's Wine Polo Shirt detail"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "mt-04",
    name: "WOX Men's Sage Green Polo Shirt",
    slug: "wox-sage-polo-shirt",
    basePrice: 4,
    salePrice: 2,
    averageRating: 4.4,
    reviewCount: 201,
    images: [
      img("men", "t-shirts", "wox-sage-polo-shirt", 1, "WOX Men's Sage Green Polo Shirt front view"),
      img("men", "t-shirts", "wox-sage-polo-shirt", 2, "WOX Men's Sage Green Polo Shirt detail"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },
  {
    id: "mt-05",
    name: "WOX Men's Black Polo Shirt",
    slug: "wox-black-polo-shirt",
    basePrice: 5,
    salePrice: 3,
    averageRating: 4.3,
    reviewCount: 178,
    images: [
      img("men", "t-shirts", "wox-black-polo-shirt", 1, "WOX Men's Black Polo Shirt front view"),
    ],
    category: { name: "T-Shirts", gender: "men" },
  },

  // ── Men's Pants ───────────────────────────────────────────
  {
    id: "mp-01",
    name: "WOX Men's Khaki Cargo Pants",
    slug: "wox-khaki-cargo-pants",
    basePrice: 9,
    salePrice: 7,
    averageRating: 4.6,
    reviewCount: 287,
    images: [
      img("men", "pants", "wox-khaki-cargo-pants", 1, "WOX Men's Khaki Cargo Pants front view"),
      img("men", "pants", "wox-khaki-cargo-pants", 2, "WOX Men's Khaki Cargo Pants side view"),
    ],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "mp-02",
    name: "WOX Men's Black Cargo Pants",
    slug: "wox-black-cargo-pants",
    basePrice: 8,
    salePrice: 6,
    averageRating: 4.5,
    reviewCount: 198,
    images: [
      img("men", "pants", "wox-black-cargo-pants", 1, "WOX Men's Black Cargo Pants front view"),
      img("men", "pants", "wox-black-cargo-pants", 2, "WOX Men's Black Cargo Pants detail"),
    ],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "mp-03",
    name: "WOX Men's Navy Formal Chinos",
    slug: "wox-navy-formal-chinos",
    basePrice: 7,
    salePrice: 5,
    averageRating: 4.7,
    reviewCount: 356,
    images: [
      img("men", "pants", "wox-navy-formal-chinos", 1, "WOX Men's Navy Formal Chinos front view"),
      img("men", "pants", "wox-navy-formal-chinos", 2, "WOX Men's Navy Formal Chinos detail"),
    ],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "mp-04",
    name: "WOX Men's Black Formal Trousers",
    slug: "wox-black-formal-trousers",
    basePrice: 9,
    salePrice: 7,
    averageRating: 4.4,
    reviewCount: 167,
    images: [
      img("men", "pants", "wox-black-formal-trousers", 1, "WOX Men's Black Formal Trousers front view"),
      img("men", "pants", "wox-black-formal-trousers", 2, "WOX Men's Black Formal Trousers side view"),
    ],
    category: { name: "Pants", gender: "men" },
  },
  {
    id: "mp-05",
    name: "WOX Men's Olive Casual Chinos",
    slug: "wox-olive-casual-chinos",
    basePrice: 6,
    salePrice: 4,
    averageRating: 4.5,
    reviewCount: 234,
    images: [
      img("men", "pants", "wox-olive-casual-chinos", 1, "WOX Men's Olive Casual Chinos front view"),
    ],
    category: { name: "Pants", gender: "men" },
  },

  // ── Boys' Shirts ──────────────────────────────────────────
  {
    id: "bs-01",
    name: "WOX Boys' Denim Shirt",
    slug: "wox-boys-denim-shirt",
    basePrice: 5,
    salePrice: 3,
    averageRating: 4.5,
    reviewCount: 145,
    images: [
      img("boys", "shirts", "wox-boys-denim-shirt", 1, "WOX Boys' Denim Shirt front view"),
      img("boys", "shirts", "wox-boys-denim-shirt", 2, "WOX Boys' Denim Shirt detail"),
    ],
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "bs-02",
    name: "WOX Boys' Khaki Solid Shirt",
    slug: "wox-boys-khaki-shirt",
    basePrice: 4,
    salePrice: 2,
    averageRating: 4.4,
    reviewCount: 98,
    images: [
      img("boys", "shirts", "wox-boys-khaki-shirt", 1, "WOX Boys' Khaki Solid Shirt front view"),
      img("boys", "shirts", "wox-boys-khaki-shirt", 2, "WOX Boys' Khaki Solid Shirt detail"),
    ],
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "bs-03",
    name: "WOX Boys' Olive Green Shirt",
    slug: "wox-boys-olive-shirt",
    basePrice: 4,
    salePrice: 3,
    averageRating: 4.3,
    reviewCount: 76,
    images: [
      img("boys", "shirts", "wox-boys-olive-shirt", 1, "WOX Boys' Olive Green Shirt front view"),
      img("boys", "shirts", "wox-boys-olive-shirt", 2, "WOX Boys' Olive Green Shirt detail"),
    ],
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "bs-04",
    name: "WOX Boys' Maroon Solid Shirt",
    slug: "wox-boys-maroon-shirt",
    basePrice: 3,
    salePrice: null,
    averageRating: 4.2,
    reviewCount: 64,
    images: [
      img("boys", "shirts", "wox-boys-maroon-shirt", 1, "WOX Boys' Maroon Solid Shirt front view"),
      img("boys", "shirts", "wox-boys-maroon-shirt", 2, "WOX Boys' Maroon Solid Shirt detail"),
    ],
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "bs-05",
    name: "WOX Boys' Brown Casual Shirt",
    slug: "wox-boys-brown-shirt",
    basePrice: 4,
    salePrice: 2,
    averageRating: 4.4,
    reviewCount: 87,
    images: [
      img("boys", "shirts", "wox-boys-brown-shirt", 1, "WOX Boys' Brown Casual Shirt front view"),
      img("boys", "shirts", "wox-boys-brown-shirt", 2, "WOX Boys' Brown Casual Shirt detail"),
    ],
    category: { name: "Shirts", gender: "boys" },
  },
  {
    id: "bs-06",
    name: "WOX Boys' Light Blue Shirt",
    slug: "wox-boys-lightblue-shirt",
    basePrice: 4,
    salePrice: 3,
    averageRating: 4.3,
    reviewCount: 72,
    images: [
      img("boys", "shirts", "wox-boys-lightblue-shirt", 1, "WOX Boys' Light Blue Shirt front view"),
      img("boys", "shirts", "wox-boys-lightblue-shirt", 2, "WOX Boys' Light Blue Shirt detail"),
    ],
    category: { name: "Shirts", gender: "boys" },
  },

  // ── Boys' T-Shirts ────────────────────────────────────────
  {
    id: "bt-01",
    name: "WOX Boys' Grey Textured Sweatshirt",
    slug: "wox-boys-grey-sweatshirt",
    basePrice: 3,
    salePrice: 2,
    averageRating: 4.6,
    reviewCount: 198,
    images: [
      img("boys", "t-shirts", "wox-boys-grey-sweatshirt", 1, "WOX Boys' Grey Textured Sweatshirt front view"),
      img("boys", "t-shirts", "wox-boys-grey-sweatshirt", 2, "WOX Boys' Grey Textured Sweatshirt detail"),
    ],
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "bt-02",
    name: "WOX Boys' Navy Graphic Oversized Tee",
    slug: "wox-boys-navy-graphic-tee",
    basePrice: 3,
    salePrice: null,
    averageRating: 4.5,
    reviewCount: 156,
    images: [
      img("boys", "t-shirts", "wox-boys-navy-graphic-tee", 1, "WOX Boys' Navy Graphic Oversized Tee front view"),
      img("boys", "t-shirts", "wox-boys-navy-graphic-tee", 2, "WOX Boys' Navy Graphic Oversized Tee detail"),
    ],
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "bt-03",
    name: "WOX Boys' Pink Oversized Tee",
    slug: "wox-boys-pink-tee",
    basePrice: 2,
    salePrice: 1,
    averageRating: 4.4,
    reviewCount: 134,
    images: [
      img("boys", "t-shirts", "wox-boys-pink-tee", 1, "WOX Boys' Pink Oversized Tee front view"),
      img("boys", "t-shirts", "wox-boys-pink-tee", 2, "WOX Boys' Pink Oversized Tee detail"),
    ],
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "bt-04",
    name: "WOX Boys' Olive Oversized Tee",
    slug: "wox-boys-olive-tee",
    basePrice: 2,
    salePrice: null,
    averageRating: 4.3,
    reviewCount: 87,
    images: [
      img("boys", "t-shirts", "wox-boys-olive-tee", 1, "WOX Boys' Olive Oversized Tee front view"),
      img("boys", "t-shirts", "wox-boys-olive-tee", 2, "WOX Boys' Olive Oversized Tee detail"),
    ],
    category: { name: "T-Shirts", gender: "boys" },
  },
  {
    id: "bt-05",
    name: "WOX Boys' Black Oversized Tee",
    slug: "wox-boys-black-tee",
    basePrice: 2,
    salePrice: 1,
    averageRating: 4.2,
    reviewCount: 65,
    images: [
      img("boys", "t-shirts", "wox-boys-black-tee", 1, "WOX Boys' Black Oversized Tee front view"),
    ],
    category: { name: "T-Shirts", gender: "boys" },
  },

  // ── Boys' Pants ───────────────────────────────────────────
  {
    id: "bp-01",
    name: "WOX Boys' Black Wide-Leg Jeans",
    slug: "wox-boys-black-wide-leg-jeans",
    basePrice: 6,
    salePrice: 4,
    averageRating: 4.6,
    reviewCount: 176,
    images: [
      img("boys", "pants", "wox-boys-black-wide-leg-jeans", 1, "WOX Boys' Black Wide-Leg Jeans front view"),
      img("boys", "pants", "wox-boys-black-wide-leg-jeans", 2, "WOX Boys' Black Wide-Leg Jeans detail"),
    ],
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "bp-02",
    name: "WOX Boys' Dark Grey Jeans",
    slug: "wox-boys-dark-grey-jeans",
    basePrice: 5,
    salePrice: null,
    averageRating: 4.5,
    reviewCount: 143,
    images: [
      img("boys", "pants", "wox-boys-dark-grey-jeans", 1, "WOX Boys' Dark Grey Jeans front view"),
      img("boys", "pants", "wox-boys-dark-grey-jeans", 2, "WOX Boys' Dark Grey Jeans detail"),
    ],
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "bp-03",
    name: "WOX Boys' Light Blue Wide-Leg Jeans",
    slug: "wox-boys-light-blue-jeans",
    basePrice: 4,
    salePrice: 3,
    averageRating: 4.4,
    reviewCount: 98,
    images: [
      img("boys", "pants", "wox-boys-light-blue-jeans", 1, "WOX Boys' Light Blue Wide-Leg Jeans front view"),
      img("boys", "pants", "wox-boys-light-blue-jeans", 2, "WOX Boys' Light Blue Wide-Leg Jeans detail"),
    ],
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "bp-04",
    name: "WOX Boys' White Wide-Leg Pants",
    slug: "wox-boys-white-wide-leg",
    basePrice: 4,
    salePrice: 2,
    averageRating: 4.3,
    reviewCount: 87,
    images: [
      img("boys", "pants", "wox-boys-white-wide-leg", 1, "WOX Boys' White Wide-Leg Pants front view"),
      img("boys", "pants", "wox-boys-white-wide-leg", 2, "WOX Boys' White Wide-Leg Pants detail"),
    ],
    category: { name: "Pants", gender: "boys" },
  },
  {
    id: "bp-05",
    name: "WOX Boys' Grey Flame Print Joggers",
    slug: "wox-boys-grey-flame-joggers",
    basePrice: 3,
    salePrice: null,
    averageRating: 4.4,
    reviewCount: 72,
    images: [
      img("boys", "pants", "wox-boys-grey-flame-joggers", 1, "WOX Boys' Grey Flame Print Joggers front view"),
      img("boys", "pants", "wox-boys-grey-flame-joggers", 2, "WOX Boys' Grey Flame Print Joggers detail"),
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
