import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Review from "@/lib/models/review";
import Product from "@/lib/models/product";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    const body = await request.json();
    const { orderId, productId, userId, userName, userEmail, rating, comment } = body;

    if (!orderId || !productId || !userId) {
      return NextResponse.json(
        { error: "orderId, productId, and userId are required" },
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
    const message = error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
