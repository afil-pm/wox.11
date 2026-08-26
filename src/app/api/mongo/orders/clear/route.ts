import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Order from "@/lib/models/order";

export async function DELETE() {
  try {
    await connectMongoDB();
    const result = await Order.deleteMany({});
    return NextResponse.json({
      message: "All orders deleted",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("DELETE /api/mongo/orders/clear error:", error);
    return NextResponse.json({ error: "Failed to delete orders" }, { status: 500 });
  }
}
