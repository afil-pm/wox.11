import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import SavedBankDetails from "@/lib/models/saved-bank-details";
import { decrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    const userId = request.headers.get("x-user-id") || "";
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const saved = await SavedBankDetails.findOne({ userId }).lean();
    if (!saved) {
      return NextResponse.json({ bankDetails: null });
    }

    let decryptedAccountNumber = saved.accountNumber;
    try {
      decryptedAccountNumber = decrypt(saved.accountNumber);
    } catch {
      // If decryption fails, return as-is
    }

    return NextResponse.json({
      bankDetails: {
        accountHolderName: saved.accountHolderName,
        accountNumber: decryptedAccountNumber,
        ifscCode: saved.ifscCode,
        bankName: saved.bankName,
        upiId: saved.upiId || "",
      },
    });
  } catch (error) {
    console.error("GET /api/saved-bank-details/decrypt error:", error);
    return NextResponse.json({ error: "Failed to fetch bank details" }, { status: 500 });
  }
}
