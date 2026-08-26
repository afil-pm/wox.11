import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    const { default: Review } = await import("@/lib/models/review");
    await connectMongoDB();

    const product = await Product.findOne({ slug }).lean() as unknown as { _id: string; averageRating?: number; reviewCount?: number } | null;
    if (!product) {
      return NextResponse.json({ reviews: [], averageRating: 0, reviewCount: 0 });
    }

    const reviews = await Review.find({ productId: product._id })
      .sort({ createdAt: -1 })
      .lean() as unknown as { _id: string; rating: number; comment: string; createdAt: string; userName: string }[];

    const formatted = reviews.map((r) => ({
      id: String(r._id),
      rating: r.rating,
      comment: r.comment,
      createdAt: String(r.createdAt),
      user: { name: r.userName },
    }));

    return NextResponse.json({
      reviews: formatted,
      averageRating: product.averageRating || 0,
      reviewCount: product.reviewCount || 0,
    });
  } catch (error) {
    console.error("GET reviews error:", error);
    return NextResponse.json({ reviews: [], averageRating: 0, reviewCount: 0 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { rating, comment, userName, userEmail } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (!userName || !userEmail) {
      return NextResponse.json({ error: "User info required" }, { status: 400 });
    }

    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    const { default: Review } = await import("@/lib/models/review");
    const { default: Order } = await import("@/lib/models/order");
    await connectMongoDB();

    const product = await Product.findOne({ slug });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const hasDelivered = await Order.findOne({
      customerEmail: userEmail,
      status: "DELIVERED",
      "items.slug": slug,
    });

    if (!hasDelivered) {
      return NextResponse.json(
        { error: "You can only review products you have purchased and received" },
        { status: 403 }
      );
    }

    const existingReview = await Review.findOne({ productId: product._id, userEmail });
    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment || "";
      await existingReview.save();
    } else {
      const mongoose = (await import("mongoose")).default;
      await Review.create({
        productId: product._id,
        userId: new mongoose.Types.ObjectId(),
        userName,
        userEmail,
        rating,
        comment: comment || "",
      });
    }

    const allReviews = await Review.find({ productId: product._id }).lean() as unknown as { rating: number }[];
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const reviewCount = allReviews.length;

    await Product.findByIdAndUpdate(product._id, {
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount,
    });

    const reviews = await Review.find({ productId: product._id })
      .sort({ createdAt: -1 })
      .lean() as unknown as { _id: string; rating: number; comment: string; createdAt: string; userName: string }[];

    const formatted = reviews.map((r) => ({
      id: String(r._id),
      rating: r.rating,
      comment: r.comment,
      createdAt: String(r.createdAt),
      user: { name: r.userName },
    }));

    return NextResponse.json({
      reviews: formatted,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount,
    });
  } catch (error) {
    console.error("POST review error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
