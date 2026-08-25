export const siteConfig = {
  name: "WOX.11",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  description:
    "Premium men's and boys' clothing. Quality shirts, t-shirts, and pants at affordable prices.",
  email: "support@wox11.com",
  phone: "+91 98765 43210",
  social: {
    instagram: "https://instagram.com/wox11",
    facebook: "https://facebook.com/wox11",
    twitter: "https://twitter.com/wox11",
  },
} as const;

export const navigationLinks = {
  men: [
    { label: "Shirts", href: "/men/shirts" },
    { label: "T-Shirts", href: "/men/t-shirts" },
    { label: "Pants", href: "/men/pants" },
  ],
  boys: [
    { label: "Shirts", href: "/boys/shirts" },
    { label: "T-Shirts", href: "/boys/t-shirts" },
    { label: "Pants", href: "/boys/pants" },
  ],
  info: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Size Guide", href: "/size-guide" },
    { label: "Shipping Policy", href: "/shipping" },
    { label: "Return Policy", href: "/returns" },
  ],
} as const;

export const categories = [
  { name: "Men's Shirts", slug: "mens-shirts", gender: "men" as const },
  { name: "Men's T-Shirts", slug: "mens-t-shirts", gender: "men" as const },
  { name: "Men's Pants", slug: "mens-pants", gender: "men" as const },
  { name: "Boys' Shirts", slug: "boys-shirts", gender: "boys" as const },
  { name: "Boys' T-Shirts", slug: "boys-t-shirts", gender: "boys" as const },
  { name: "Boys' Pants", slug: "boys-pants", gender: "boys" as const },
] as const;

export const priceRanges = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 - ₹1000", min: 500, max: 1000 },
  { label: "₹1000 - ₹2000", min: 1000, max: 2000 },
  { label: "₹2000 - ₹3000", min: 2000, max: 3000 },
  { label: "Above ₹3000", min: 3000, max: Infinity },
] as const;

export const availableSizes = {
  men: ["XS", "S", "M", "L", "XL", "XXL"],
  boys: ["4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"],
} as const;

export const orderStatuses = [
  { label: "Pending", value: "PENDING" as const },
  { label: "Confirmed", value: "CONFIRMED" as const },
  { label: "Processing", value: "PROCESSING" as const },
  { label: "Packed", value: "PACKED" as const },
  { label: "Shipped", value: "SHIPPED" as const },
  { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" as const },
  { label: "Delivered", value: "DELIVERED" as const },
  { label: "Cancelled", value: "CANCELLED" as const },
  { label: "Returned", value: "RETURNED" as const },
  { label: "Refunded", value: "REFUNDED" as const },
] as const;

export const paymentMethods = [
  { label: "Razorpay", value: "RAZORPAY" as const },
  { label: "UPI", value: "UPI" as const },
  { label: "Credit/Debit Card", value: "CARD" as const },
  { label: "Net Banking", value: "NET_BANKING" as const },
  { label: "Wallet", value: "WALLET" as const },
  { label: "Cash on Delivery", value: "COD" as const },
] as const;

export const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Best Rating", value: "rating" },
  { label: "Popularity", value: "popular" },
] as const;
