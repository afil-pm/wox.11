import Product from "@/lib/models/product";
import Coupon from "@/lib/models/coupon";
import { calculateOrderTax, SELLER_STATE, TaxInput } from "@/lib/tax";

export const INDIAN_STATES = [
  "kerala","andhra pradesh","arunachal pradesh","assam","bihar","chhattisgarh",
  "goa","gujarat","haryana","himachal pradesh","jharkhand","karnataka",
  "madhya pradesh","maharashtra","manipur","meghalaya","mizoram","nagaland",
  "odisha","punjab","rajasthan","sikkim","tamil nadu","telangana","tripura",
  "uttar pradesh","uttarakhand","west bengal","andaman and nicobar islands",
  "chandigarh","dadra and nagar haveli and daman and diu","delhi",
  "jammu and kashmir","ladakh","lakshadweep","puducherry",
];

export function computeShippingCost(state: string): number {
  const s = state.trim().toLowerCase();
  if (s === "kerala") return 0;
  if (INDIAN_STATES.includes(s)) return 50;
  return -1;
}

export interface OrderAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  taluk?: string;
  district?: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OrderItemInput {
  name: string;
  price?: number;
  quantity: number;
  size: string;
  image?: string;
  slug?: string;
}

export interface PreparedOrderPayload {
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: OrderAddress;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    size: string;
    image: string;
    slug: string;
    hsnCode: string;
    gstRate: number;
    taxableAmount: number;
    gstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    finalAmount: number;
  }>;
  subtotal: number;
  couponCode: string;
  couponDiscount: number;
  shippingCost: number;
  tax: number;
  total: number;
  taxDetails: {
    totalTaxableAmount: number;
    totalGstAmount: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    sellerState: string;
    customerState: string;
    isInterState: boolean;
  };
  paymentMethod: "razorpay" | "cod";
  paymentId: string;
  notes: string;
  /** Suppliers whose products appear in this order ("" = store owned, excluded). */
  supplierIds: string[];
}

export type PrepareResult =
  | { ok: false; error: string; status: number }
  | { ok: true; data: PreparedOrderPayload };

/**
 * Validates a raw order payload and rebuilds every money field from product
 * and coupon data on the server. Client supplied prices/totals are never used.
 */
export async function prepareOrderPayload(body: Record<string, unknown>): Promise<PrepareResult> {
  const orderNumber = body.orderNumber as string | undefined;
  const userId = (body.userId as string | undefined) || "";
  const customerName = (body.customerName as string | undefined) || "";
  const customerPhone = (body.customerPhone as string | undefined) || "";
  const customerEmail = (body.customerEmail as string | undefined) || "";
  const address = body.address as OrderAddress | undefined;
  const items = (body.items as OrderItemInput[] | undefined) || undefined;
  const paymentMethod = (body.paymentMethod as "razorpay" | "cod" | undefined) || "cod";
  const paymentId = (body.paymentId as string | undefined) || "";
  const notes = (body.notes as string | undefined) || "";
  const couponCode = body.couponCode as string | undefined;

  if (!orderNumber || !items?.length || !address) {
    return { ok: false, error: "Missing required fields", status: 400 };
  }

  const requiredAddressFields = ["name", "phone", "line1", "city", "state", "pincode"];
  const missingFields = requiredAddressFields.filter((f) => !address[f as keyof OrderAddress]?.trim());
  if (missingFields.length > 0) {
    return {
      ok: false,
      error: `Missing required address fields: ${missingFields.join(", ")}`,
      status: 400,
    };
  }

  const shippingCost = computeShippingCost(address.state);
  if (shippingCost === -1) {
    return {
      ok: false,
      error: "Currently unavailable for this location. We only deliver within India.",
      status: 400,
    };
  }

  const slugs = items.map((item) => item.slug).filter(Boolean) as string[];
  const products = await Product.find({ slug: { $in: slugs } }).lean();
  const productMap = new Map(products.map((p) => [p.slug, p]));
  const supplierIds = [
    ...new Set(products.map((p) => p.supplierId || "").filter(Boolean)),
  ] as string[];

  let serverSubtotal = 0;
  const taxInputs: TaxInput[] = [];
  const serverItems = items.map((item) => {
    const product = item.slug ? productMap.get(item.slug) : null;
    const price = product ? (product.salePrice > 0 ? product.salePrice : product.basePrice) : 0;
    const gstRate = product?.tax?.gstRate ?? 5;
    const taxInclusive = product?.tax?.taxInclusive ?? true;
    serverSubtotal += price * item.quantity;
    taxInputs.push({ salePrice: price, quantity: item.quantity, gstRate, taxInclusive });
    return {
      name: item.name,
      price,
      quantity: item.quantity,
      size: item.size,
      image: item.image || "",
      slug: item.slug || "",
      hsnCode: product?.tax?.hsnCode || "6211",
      gstRate,
      taxableAmount: 0,
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      finalAmount: 0,
    };
  });

  if (serverItems.some((item) => item.price <= 0 || item.quantity <= 0)) {
    return { ok: false, error: "One or more products are unavailable or have invalid pricing", status: 400 };
  }

  let couponDiscount = 0;
  let validatedCouponCode = "";
  if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), active: true });
    if (!coupon) {
      return { ok: false, error: "Invalid coupon code", status: 400 };
    }
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return { ok: false, error: "Invalid coupon code", status: 400 };
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return { ok: false, error: "Invalid coupon code", status: 400 };
    }

    let applicableSubtotal = 0;
    if (coupon.allProducts) {
      applicableSubtotal = serverSubtotal;
    } else {
      for (const item of serverItems) {
        if (coupon.applicableProducts.includes(item.slug)) {
          applicableSubtotal += item.price * item.quantity;
        }
      }
    }

    if (coupon.minOrderAmount > 0 && applicableSubtotal < coupon.minOrderAmount) {
      return { ok: false, error: "Invalid coupon code", status: 400 };
    }

    if (coupon.discountType === "percent") {
      couponDiscount = Math.round(applicableSubtotal * (coupon.discountValue / 100));
      if (coupon.maxDiscount > 0 && couponDiscount > coupon.maxDiscount) {
        couponDiscount = coupon.maxDiscount;
      }
    } else {
      couponDiscount = Math.min(coupon.discountValue, applicableSubtotal);
    }
    couponDiscount = Math.max(0, Math.min(couponDiscount, applicableSubtotal));
    validatedCouponCode = coupon.code;
  }

  const discountedSubtotal = Math.max(serverSubtotal - couponDiscount, 0);
  const customerState = address.state.trim();
  const orderTax = calculateOrderTax(taxInputs, SELLER_STATE, customerState);

  for (let i = 0; i < serverItems.length; i++) {
    const r = orderTax.items[i];
    serverItems[i].taxableAmount = r.taxableAmount;
    serverItems[i].gstAmount = r.gstAmount;
    serverItems[i].cgstAmount = r.cgstAmount;
    serverItems[i].sgstAmount = r.sgstAmount;
    serverItems[i].igstAmount = r.igstAmount;
    serverItems[i].finalAmount = r.finalAmount;
  }

  const tax = orderTax.totalGstAmount;
  const total = discountedSubtotal + shippingCost + tax;

  if (total <= 0) {
    return { ok: false, error: "Order total must be greater than ₹0", status: 400 };
  }

  const stockErrors: string[] = [];
  for (const item of items) {
    if (!item.slug) continue;
    const product = productMap.get(item.slug);
    if (!product) continue;

    const variant = product.variants?.find(
      (v: { sizes: { name: string; quantity: number }[] }) =>
        v.sizes?.some((s: { name: string; quantity: number }) => s.name === item.size)
    );
    if (!variant) {
      stockErrors.push(`${item.name} (${item.size}) - variant not found`);
      continue;
    }
    const sizeData = variant.sizes.find(
      (s: { name: string; quantity: number }) => s.name === item.size
    );
    if (!sizeData) {
      stockErrors.push(`${item.name} (${item.size}) - size not found`);
      continue;
    }
    if (sizeData.quantity < item.quantity) {
      stockErrors.push(`${item.name} (${item.size}) - only ${sizeData.quantity} left`);
    }
  }

  if (stockErrors.length > 0) {
    return { ok: false, error: `Insufficient stock: ${stockErrors.join("; ")}`, status: 400 };
  }

  return {
    ok: true,
    data: {
      orderNumber,
      userId,
      customerName: customerName || address.name,
      customerPhone: customerPhone || address.phone,
      customerEmail,
      address,
      items: serverItems,
      subtotal: serverSubtotal,
      couponCode: validatedCouponCode,
      couponDiscount,
      shippingCost,
      tax,
      total,
      taxDetails: {
        totalTaxableAmount: orderTax.totalTaxableAmount,
        totalGstAmount: orderTax.totalGstAmount,
        totalCgst: orderTax.totalCgst,
        totalSgst: orderTax.totalSgst,
        totalIgst: orderTax.totalIgst,
        sellerState: SELLER_STATE,
        customerState,
        isInterState: SELLER_STATE.trim().toLowerCase() !== customerState.toLowerCase(),
      },
      paymentMethod,
      paymentId,
      notes,
      supplierIds,
    },
  };
}
