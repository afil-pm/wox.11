import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Product from "@/lib/models/product";
import { sendNewOrderEmail } from "@/lib/email";

const INDIAN_STATES = [
  "kerala","andhra pradesh","arunachal pradesh","assam","bihar","chhattisgarh",
  "goa","gujarat","haryana","himachal pradesh","jharkhand","karnataka",
  "madhya pradesh","maharashtra","manipur","meghalaya","mizoram","nagaland",
  "odisha","punjab","rajasthan","sikkim","tamil nadu","telangana","tripura",
  "uttar pradesh","uttarakhand","west bengal","andaman and nicobar islands",
  "chandigarh","dadra and nagar haveli and daman and diu","delhi",
  "jammu and kashmir","ladakh","lakshadweep","puducherry",
];

function isAdmin(request: NextRequest): boolean {
  const adminHeader = request.headers.get("x-admin-email");
  if (!adminHeader) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "";
  if (!adminEmail) return true;
  return adminHeader.toLowerCase() === adminEmail.toLowerCase();
}

function computeShippingCost(state: string): number {
  const s = state.trim().toLowerCase();
  if (s === "kerala") return 0;
  if (INDIAN_STATES.includes(s)) return 50;
  return -1;
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const status = searchParams.get("status");
    const userId = request.headers.get("x-user-id") || searchParams.get("userId") || "";

    if (!userId && !isAdmin(request)) {
      return NextResponse.json({ orders: [], total: 0 });
    }

    const filter: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (!isAdmin(request) && userId) {
      filter.userId = userId;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({ orders, total, limit, skip });
  } catch (error) {
    console.error("GET /api/mongo/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    const body = await request.json();

    const {
      orderNumber,
      userId,
      customerName,
      customerPhone,
      customerEmail,
      address,
      items,
      paymentMethod,
      paymentId,
      notes,
    } = body;

    if (!orderNumber || !items?.length || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const requiredAddressFields = ["name", "phone", "line1", "city", "state", "pincode"];
    const missingFields = requiredAddressFields.filter((f) => !address[f]?.trim());
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required address fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const stateNormalized = address.state.trim().toLowerCase();
    const shippingCost = computeShippingCost(address.state);
    if (shippingCost === -1) {
      return NextResponse.json(
        { error: "Currently unavailable for this location. We only deliver within India." },
        { status: 400 }
      );
    }

    const slugs = items.map((item: { slug?: string }) => item.slug).filter(Boolean);
    const products = await Product.find({ slug: { $in: slugs } }).lean();
    const productMap = new Map(products.map((p) => [p.slug, p]));

    let serverSubtotal = 0;
    const serverItems = items.map((item: { name: string; slug?: string; size: string; quantity: number; image?: string }) => {
      const product = item.slug ? productMap.get(item.slug) : null;
      const price = product ? (product.salePrice > 0 ? product.salePrice : product.basePrice) : 0;
      serverSubtotal += price * item.quantity;
      return {
        name: item.name,
        price,
        quantity: item.quantity,
        size: item.size,
        image: item.image || "",
        slug: item.slug || "",
      };
    });

    if (serverItems.some((item: { price: number; quantity: number }) => item.price <= 0 || item.quantity <= 0)) {
      return NextResponse.json(
        { error: "One or more products are unavailable or have invalid pricing" },
        { status: 400 }
      );
    }

    const tax = Math.round(serverSubtotal * 0.18);
    const total = serverSubtotal + shippingCost + tax;

    if (total <= 0) {
      return NextResponse.json(
        { error: "Order total must be greater than ₹0" },
        { status: 400 }
      );
    }

    const order = await Order.create({
      orderNumber,
      userId: userId || "",
      customerName: customerName || address.name,
      customerPhone: customerPhone || address.phone,
      customerEmail: customerEmail || "",
      address,
      items: serverItems,
      subtotal: serverSubtotal,
      shippingCost,
      tax,
      total,
      paymentMethod: paymentMethod || "cod",
      paymentId: paymentId || "",
      paymentStatus: paymentId ? "PAID" : "PENDING",
      status: "PENDING",
      notes: notes || "",
    });

    sendNewOrderEmail({
      orderNumber,
      customerName: customerName || address.name,
      customerPhone: customerPhone || address.phone,
      customerEmail: customerEmail || "",
      address,
      items: serverItems,
      total,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentId ? "PAID" : "PENDING",
    }).catch(() => {});

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/mongo/orders error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
