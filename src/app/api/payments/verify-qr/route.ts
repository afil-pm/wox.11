import { NextRequest, NextResponse } from "next/server";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
    }

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

    const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!res.ok) {
      return NextResponse.json({ status: "pending" });
    }

    const order = await res.json();

    if (order.status === "paid") {
      const paymentsRes = await fetch(
        `https://api.razorpay.com/v1/orders/${orderId}/payments`,
        { headers: { Authorization: `Basic ${auth}` } }
      );

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        const capturedPayment = paymentsData.items?.find(
          (p: { status: string }) => p.status === "captured"
        );
        if (capturedPayment) {
          return NextResponse.json({
            status: "paid",
            paymentId: capturedPayment.id,
          });
        }
      }

      return NextResponse.json({ status: "paid", paymentId: "" });
    }

    if (order.status === "attempted") {
      return NextResponse.json({ status: "failed" });
    }

    return NextResponse.json({ status: "pending" });
  } catch (e) {
    console.error("verify-qr error:", e);
    return NextResponse.json({ status: "pending" });
  }
}
