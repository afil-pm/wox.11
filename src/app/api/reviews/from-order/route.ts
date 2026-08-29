import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Review from "@/lib/models/review";
import Product from "@/lib/models/product";
import mongoose from "mongoose";

const reviewAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_REVIEW_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = reviewAttempts.get(key);
  if (!record || now > record.resetAt) {
    reviewAttempts.set(key, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
    return true;
  }
  if (record.count >= MAX_REVIEW_ATTEMPTS) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    const body = await request.json();
    const { orderId, productId, userName, userEmail, rating, comment } = body;

    const userId = request.headers.get("x-user-id") || "";
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const rateKey = userId;
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json({ error: "Too many review attempts. Please try again later." }, { status: 429 });
    }

    if (!orderId || !productId) {
      return NextResponse.json(
        { error: "orderId and productId are required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!userName || !userEmail) {
      return NextResponse.json(
        { error: "User info required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId).lean() as unknown as {
      _id: string;
      userId: string;
      status: string;
      paymentStatus: string;
      items: { slug: string }[];
    } | null;

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.userId !== userId) {
      return NextResponse.json(
        { error: "This order does not belong to you" },
        { status: 403 }
      );
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "You can only review products from delivered orders" },
        { status: 400 }
      );
    }

    if (order.paymentStatus !== "PAID" && order.paymentStatus !== "COMPLETED") {
      return NextResponse.json(
        { error: "You can only review products from paid orders" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId).lean() as unknown as { _id: string } | null;
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const productSlug = (await Product.findById(productId).lean() as unknown as { slug: string } | null)?.slug;
    const itemInOrder = order.items.some((item) => item.slug === productSlug);
    if (!itemInOrder) {
      return NextResponse.json(
        { error: "This product is not part of this order" },
        { status: 400 }
      );
    }

    const existingReview = await Review.findOne({
      productId: new mongoose.Types.ObjectId(productId),
      userId: new mongoose.Types.ObjectId(userId),
      orderId: new mongoose.Types.ObjectId(orderId),
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product from this order" },
        { status: 400 }
      );
    }

    await Review.create({
      productId: new mongoose.Types.ObjectId(productId),
      userId: new mongoose.Types.ObjectId(userId),
      orderId: new mongoose.Types.ObjectId(orderId),
      userName,
      userEmail,
      rating,
      comment: comment || "",
    });

    const allReviews = await Review.find({ productId: new mongoose.Types.ObjectId(productId) }).lean() as unknown as { rating: number }[];
    const avgRating = allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length;
    const reviewCount = allReviews.length;

    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount,
    });

    return NextResponse.json({
      message: "Review submitted successfully",
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount,
    });
  } catch (error) {
    console.error("POST /api/reviews/from-order error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
