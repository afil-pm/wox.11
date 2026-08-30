import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import SavedBankDetails from "@/lib/models/saved-bank-details";
import { encrypt, decrypt, maskAccountNumber } from "@/lib/encryption";

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

    return NextResponse.json({
      bankDetails: {
        _id: saved._id,
        accountHolderName: saved.accountHolderName,
        accountNumber: maskAccountNumber(saved.accountNumber),
        ifscCode: saved.ifscCode,
        bankName: saved.bankName,
        upiId: saved.upiId || "",
      },
    });
  } catch (error) {
    console.error("GET /api/saved-bank-details error:", error);
    return NextResponse.json({ error: "Failed to fetch bank details" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectMongoDB();
    const userId = request.headers.get("x-user-id") || "";
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { accountHolderName, accountNumber, ifscCode, bankName, upiId } = body;

    if (!accountHolderName?.trim() || !accountNumber?.trim() || !ifscCode?.trim() || !bankName?.trim()) {
      return NextResponse.json({ error: "All bank details are required" }, { status: 400 });
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase())) {
      return NextResponse.json({ error: "Invalid IFSC code format" }, { status: 400 });
    }

    const encryptedAccountNumber = encrypt(accountNumber.trim());

    const existing = await SavedBankDetails.findOne({ userId });
    if (existing) {
      existing.accountHolderName = accountHolderName.trim();
      existing.accountNumber = encryptedAccountNumber;
      existing.ifscCode = ifscCode.trim().toUpperCase();
      existing.bankName = bankName.trim();
      existing.upiId = upiId?.trim() || "";
      await existing.save();
    } else {
      await SavedBankDetails.create({
        userId,
        accountHolderName: accountHolderName.trim(),
        accountNumber: encryptedAccountNumber,
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankName.trim(),
        upiId: upiId?.trim() || "",
      });
    }

    return NextResponse.json({ message: "Bank details saved successfully" });
  } catch (error) {
    console.error("PUT /api/saved-bank-details error:", error);
    return NextResponse.json({ error: "Failed to save bank details" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectMongoDB();
    const userId = request.headers.get("x-user-id") || "";
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await SavedBankDetails.deleteOne({ userId });
    return NextResponse.json({ message: "Bank details deleted" });
  } catch (error) {
    console.error("DELETE /api/saved-bank-details error:", error);
    return NextResponse.json({ error: "Failed to delete bank details" }, { status: 500 });
  }
}
