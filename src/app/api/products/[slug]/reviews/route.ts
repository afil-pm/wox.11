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
    const { rateLimit, clientIp } = await import("@/lib/security/rate-limit");
    const rate = rateLimit("review-submit", clientIp(request), 10, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const { rating, comment, userName, userEmail } = body;

    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (typeof userName !== "string" || userName.trim().length < 2 || userName.trim().length > 100) {
      return NextResponse.json({ error: "User info required" }, { status: 400 });
    }

    if (typeof userEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) {
      return NextResponse.json({ error: "User info required" }, { status: 400 });
    }

    if (comment !== undefined && (typeof comment !== "string" || comment.length > 1000)) {
      return NextResponse.json({ error: "Review too long" }, { status: 400 });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();

    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: Product } = await import("@/lib/models/product");
    const { default: Review } = await import("@/lib/models/review");
    const { default: Order } = await import("@/lib/models/order");
    const { customerUserId } = await import("@/lib/auth/identity");
    await connectMongoDB();

    const product = await Product.findOne({ slug });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const identity = await customerUserId(request, request.headers.get("x-user-id"));
    // Review.userId is an ObjectId: only an account id can be stored there,
    // a visitor uid would cast-fail.
    const identityObjectId = identity && /^[a-f0-9]{24}$/i.test(identity) ? identity : null;

    const hasDelivered = await Order.findOne({
      ...(identityObjectId ? { $or: [{ customerEmail: normalizedEmail }, { userId: identityObjectId }] } : { customerEmail: normalizedEmail }),
      status: "DELIVERED",
      "items.slug": slug,
    });

    if (!hasDelivered) {
      return NextResponse.json(
        { error: "You can only review products you have purchased and received" },
        { status: 403 }
      );
    }

    const existingReview = await Review.findOne({ productId: product._id, userEmail: normalizedEmail });
    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment || "";
      await existingReview.save();
    } else {
      const mongoose = (await import("mongoose")).default;
      await Review.create({
        productId: product._id,
        userId: identityObjectId || new mongoose.Types.ObjectId(),
        userName: userName.trim(),
        userEmail: normalizedEmail,
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
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
