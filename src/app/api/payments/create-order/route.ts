import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const rate = rateLimit("payment-create-order", clientIp(req), 10, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { amount, currency, receipt } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    if (currency !== undefined && (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency))) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
    }

    if (receipt !== undefined && (typeof receipt !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(receipt))) {
      return NextResponse.json({ error: "Invalid receipt reference" }, { status: 400 });
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to env." },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: currency || "INR",
        receipt: receipt || `wox11_${Date.now()}`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Razorpay order creation failed:", err);
      return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
    }

    const order = await res.json();
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (e) {
    console.error("Payment error:", e);
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 500 });
  }
}
