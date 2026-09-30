import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Coupon from "@/lib/models/coupon";
import Product from "@/lib/models/product";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const MAX_CART_ITEMS = 100;

export async function POST(request: NextRequest) {
  try {
    const rate = rateLimit("coupon-validate", clientIp(request), 30, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { valid: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { code, cartItems } = body;

    if (!code) {
      return NextResponse.json({ error: "Coupon code required" }, { status: 400 });
    }

    if (typeof code !== "string" || code.length > 40) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { status: 400 });
    }

    const items = Array.isArray(cartItems) ? cartItems.slice(0, MAX_CART_ITEMS) : [];

    await connectMongoDB();
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), active: true });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { status: 400 });
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { status: 400 });
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { status: 400 });
    }

    let subtotal = 0;
    let discount = 0;

    const usableItems = items.filter(
      (item: { slug?: unknown; productId?: unknown; quantity?: unknown }) =>
        typeof item?.slug === "string" && typeof item?.quantity === "number" && item.quantity > 0
    );

    if (coupon.allProducts) {
      for (const item of usableItems) {
        const product = await Product.findOne({ slug: item.slug }).lean();
        if (product) {
          const price = product.salePrice > 0 ? product.salePrice : product.basePrice;
          subtotal += price * item.quantity;
        }
      }
    } else {
      for (const item of usableItems) {
        if (coupon.applicableProducts.includes(item.productId || item.slug)) {
          const product = await Product.findOne({ slug: item.slug }).lean();
          if (product) {
            const price = product.salePrice > 0 ? product.salePrice : product.basePrice;
            subtotal += price * item.quantity;
          }
        }
      }
    }

    if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { status: 400 });
    }

    if (coupon.discountType === "percent") {
      discount = Math.round(subtotal * (coupon.discountValue / 100));
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    discount = Math.max(0, Math.min(discount, subtotal));

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      applicableProducts: coupon.allProducts ? "all" : coupon.applicableProducts,
    });
  } catch (error) {
    console.error("POST /api/coupons/validate error:", error);
    return NextResponse.json({ valid: false, error: "Failed to validate coupon" }, { status: 500 });
  }
}
