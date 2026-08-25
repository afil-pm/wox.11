import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be at most 100 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─── Product ─────────────────────────────────────────────────────────────────

export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]).optional(),
  minPrice: z
    .number()
    .int("Minimum price must be an integer")
    .min(0, "Minimum price cannot be negative")
    .optional(),
  maxPrice: z
    .number()
    .int("Maximum price must be an integer")
    .min(0, "Maximum price cannot be negative")
    .optional(),
  sizes: z.array(z.string()).optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "popular", "rating"])
    .optional()
    .default("newest"),
  page: z
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),
  limit: z
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .optional()
    .default(12),
}).refine(
  (data) => {
    if (data.minPrice !== undefined && data.maxPrice !== undefined) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  {
    message: "Minimum price cannot be greater than maximum price",
    path: ["minPrice"],
  }
);

export type ProductFilterInput = z.infer<typeof productFilterSchema>;

// ─── Address ─────────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  line1: z
    .string()
    .min(1, "Address line 1 is required")
    .max(255, "Address line 1 must be at most 255 characters"),
  line2: z
    .string()
    .max(255, "Address line 2 must be at most 255 characters")
    .optional(),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be at most 100 characters"),
  state: z
    .string()
    .min(1, "State is required")
    .max(100, "State must be at most 100 characters"),
  pincode: z
    .string()
    .min(1, "Pincode is required")
    .regex(/^\d{6}$/, "Invalid pincode. Must be 6 digits"),
  landmark: z
    .string()
    .max(100, "Landmark must be at most 100 characters")
    .optional(),
  isDefault: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

// ─── Cart ────────────────────────────────────────────────────────────────────

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  sizeId: z.string().min(1, "Size ID is required"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(10, "Quantity cannot exceed 10"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

// ─── Checkout ────────────────────────────────────────────────────────────────

export const checkoutSchema = z.object({
  addressId: z.string().min(1, "Delivery address is required"),
  paymentMethod: z.enum(
    ["RAZORPAY", "UPI", "CARD", "NET_BANKING", "WALLET", "COD"],
    {
      message: "Invalid payment method",
    }
  ),
  notes: z
    .string()
    .max(500, "Notes must be at most 500 characters")
    .optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ─── Coupon ──────────────────────────────────────────────────────────────────

export const applyCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Coupon code is required")
    .max(50, "Coupon code must be at most 50 characters")
    .toUpperCase(),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;

// ─── Review ──────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .max(1000, "Comment must be at most 1000 characters")
    .optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// ─── Admin Product ───────────────────────────────────────────────────────────

export const adminProductSchema = z
  .object({
    name: z
      .string()
      .min(1, "Product name is required")
      .max(200, "Product name must be at most 200 characters"),
    description: z
      .string()
      .max(5000, "Description must be at most 5000 characters")
      .optional(),
    basePrice: z
      .number()
      .int("Base price must be an integer")
      .min(1, "Base price must be at least 1"),
    salePrice: z
      .number()
      .int("Sale price must be an integer")
      .min(0, "Sale price cannot be negative")
      .optional(),
    sku: z
      .string()
      .min(1, "SKU is required")
      .max(50, "SKU must be at most 50 characters")
      .regex(
        /^[A-Z0-9-]+$/,
        "SKU must contain only uppercase letters, numbers, and hyphens"
      ),
    categoryId: z.string().min(1, "Category is required"),
    isActive: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (data.salePrice !== undefined && data.salePrice >= data.basePrice) {
        return false;
      }
      return true;
    },
    {
      message: "Sale price must be less than base price",
      path: ["salePrice"],
    }
  );

export type AdminProductInput = z.infer<typeof adminProductSchema>;

// ─── Cart Update ─────────────────────────────────────────────────────────────

export const updateCartItemSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(10, "Quantity cannot exceed 10"),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const removeCartItemSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
});

export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;

// ─── Wishlist ────────────────────────────────────────────────────────────────

export const addToWishlistSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;

export const removeFromWishlistSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export type RemoveFromWishlistInput = z.infer<typeof removeFromWishlistSchema>;

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orderPaginationSchema = z.object({
  page: z
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),
  limit: z
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .optional()
    .default(10),
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
      "REFUNDED",
    ])
    .optional(),
});

export type OrderPaginationInput = z.infer<typeof orderPaginationSchema>;

// ─── Admin Order Status ─────────────────────────────────────────────────────

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  status: z.enum(
    [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
      "REFUNDED",
    ],
    { message: "Invalid order status" }
  ),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
