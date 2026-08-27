import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";

const CLEAR_PASSWORD = process.env.ORDER_CLEAR_PASSWORD || "";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password || password !== CLEAR_PASSWORD) {
      return NextResponse.json(
        { error: "Incorrect password. Order history not cleared." },
        { status: 403 }
      );
    }

    await connectMongoDB();
    const result = await Order.deleteMany({});
    return NextResponse.json({
      message: "All orders deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("DELETE /api/mongo/orders/clear error:", error);
    return NextResponse.json({ error: "Failed to delete orders" }, { status: 500 });
  }
}
