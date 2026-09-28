import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/user";
import { isAdmin } from "@/lib/auth/guards";
import { notifyUser } from "@/lib/notify";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"];
const VERIFICATIONS = ["PENDING_VERIFICATION", "VERIFIED", "REJECTED"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectMongoDB();
    const { id } = await params;
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const update: Record<string, unknown> = {};
    const currentDate: Record<string, true> = {};

    if (body.verificationStatus !== undefined) {
      if (!VERIFICATIONS.includes(body.verificationStatus)) {
        return NextResponse.json({ error: "Invalid verification status" }, { status: 400 });
      }
      update.verificationStatus = body.verificationStatus;

      if (body.verificationStatus === "VERIFIED") {
        currentDate.supplierApprovedAt = true;
        // Verification completes the account: activate it unless it was
        // explicitly suspended afterwards.
        update.supplierStatus = "PENDING";
      } else if (body.verificationStatus === "REJECTED") {
        currentDate.supplierRejectedAt = true;
      }
    }

    if (body.supplierStatus !== undefined) {
      if (!STATUSES.includes(body.supplierStatus)) {
        return NextResponse.json({ error: "Invalid supplier status" }, { status: 400 });
      }
      update.supplierStatus = body.supplierStatus;
    }

    if (body.canUpdateOrderStatus !== undefined) {
      update["supplierPermissions.canUpdateOrderStatus"] = body.canUpdateOrderStatus === true;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // Only a real transition into VERIFIED notifies the supplier, so clicking
    // "Verify" twice can never send (or store) the same event twice.
    const alreadyVerified =
      body.verificationStatus === "VERIFIED" &&
      (await User.findById(id).select("verificationStatus").lean())?.verificationStatus ===
        "VERIFIED";

    const supplier = await User.findOneAndUpdate(
      { _id: id, role: "SUPPLIER" },
      {
        $set: update,
        ...(Object.keys(currentDate).length > 0 ? { $currentDate: currentDate } : {}),
      },
      { new: true }
    ).select(
      "name email supplierName verificationStatus supplierStatus supplierPermissions createdAt supplierApprovedAt supplierRejectedAt"
    );

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    if (body.verificationStatus === "VERIFIED" && !alreadyVerified) {
      await notifyUser({
        userId: String(supplier._id),
        title: "Supplier verification completed",
        body: `Hi ${supplier.name}, your supplier account has been verified. You can now sign in to your supplier panel.`,
        type: "supplier_verification",
        url: "/wox/supplier",
        tag: `supplier-verification-${supplier._id}`,
        dedupeKey: `supplier:${supplier._id}:verified`,
      });
    }

    return NextResponse.json({
      supplier: {
        id: String(supplier._id),
        name: supplier.name,
        email: supplier.email,
        supplierName: supplier.supplierName || supplier.name,
        verificationStatus: supplier.verificationStatus,
        status: supplier.supplierStatus,
        canUpdateOrderStatus: supplier.supplierPermissions?.canUpdateOrderStatus === true,
        createdAt: supplier.createdAt,
        supplierApprovedAt: supplier.supplierApprovedAt || null,
        supplierRejectedAt: supplier.supplierRejectedAt || null,
      },
    });
  } catch (error) {
    console.error("PATCH /api/wox/admin/suppliers/[id] error:", error);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}
