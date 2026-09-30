import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import SavedBankDetails from "@/lib/models/saved-bank-details";
import { customerUserId } from "@/lib/auth/identity";
import { decrypt } from "@/lib/encryption";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Plaintext account numbers: cap how often one caller can pull them.
    const rate = rateLimit("bank-details-decrypt", clientIp(request), 10, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    await connectMongoDB();
    const userId = await customerUserId(request, request.headers.get("x-user-id"));
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
