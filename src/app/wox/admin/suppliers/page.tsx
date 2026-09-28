"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Ban, Truck, RefreshCw, ShieldCheck, ShieldX } from "lucide-react";
import WoxLoader from "@/components/ui/wox-loader";
import { adminFetch } from "@/lib/admin-api";

interface SupplierRow {
  id: string;
  name: string;
  email: string;
  supplierName: string;
  verificationStatus: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  canUpdateOrderStatus: boolean;
  products: number;
  createdAt: string;
  supplierApprovedAt: string | null;
  supplierRejectedAt: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

const VERIFICATION_STYLES: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-700",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
};

const VERIFICATION_LABELS: Record<string, string> = {
  VERIFIED: "Verified",
  PENDING_VERIFICATION: "Pending verification",
  REJECTED: "Rejected",
};

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRow[] | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch("/api/wox/admin/suppliers");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load suppliers");
        return;
      }
      setSuppliers(data.suppliers ?? []);
    } catch {
      setError("Failed to load suppliers");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function update(
    id: string,
    patch: {
      supplierStatus?: string;
      verificationStatus?: string;
      canUpdateOrderStatus?: boolean;
    }
  ) {
    setSavingId(id);
    setError("");
    try {
      const res = await adminFetch(`/api/wox/admin/suppliers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to update supplier");
        return;
      }
      setSuppliers((prev) =>
        (prev || []).map((s) =>
          s.id === id
            ? {
                ...s,
                status: data.supplier.status,
                verificationStatus: data.supplier.verificationStatus,
                canUpdateOrderStatus: data.supplier.canUpdateOrderStatus,
                supplierApprovedAt: data.supplier.supplierApprovedAt,
                supplierRejectedAt: data.supplier.supplierRejectedAt,
              }
            : s
        )
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Suppliers</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Verify self-registered suppliers, then control what they may do. A supplier only gets
            panel access after verification.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 self-start rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {suppliers === null ? (
        <div className="flex h-48 items-center justify-center">
          <WoxLoader />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center">
          <Truck className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-500">
            No suppliers yet. Accounts appear here when someone registers as a supplier.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-4 py-3 font-medium">Order Status Rights</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{supplier.supplierName}</p>
                    <p className="text-xs text-zinc-500">
                      {supplier.name} · {supplier.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        VERIFICATION_STYLES[supplier.verificationStatus] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {VERIFICATION_LABELS[supplier.verificationStatus] ||
                        supplier.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        STATUS_STYLES[supplier.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{supplier.products}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {new Date(supplier.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={supplier.canUpdateOrderStatus}
                        disabled={savingId === supplier.id}
                        onChange={(e) =>
                          update(supplier.id, { canUpdateOrderStatus: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      Allow status updates
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {supplier.verificationStatus !== "VERIFIED" && (
                        <button
                          onClick={() => update(supplier.id, { verificationStatus: "VERIFIED" })}
                          disabled={savingId === supplier.id}
                          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {supplier.verificationStatus === "REJECTED" ? "Approve" : "Verify"}
                        </button>
                      )}
                      {supplier.verificationStatus !== "REJECTED" && (
                        <button
                          onClick={() => update(supplier.id, { verificationStatus: "REJECTED" })}
                          disabled={savingId === supplier.id}
                          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <ShieldX className="h-3.5 w-3.5" /> Reject
                        </button>
                      )}
                      {supplier.verificationStatus === "VERIFIED" &&
                        supplier.status !== "ACTIVE" && (
                          <button
                            onClick={() => update(supplier.id, { supplierStatus: "ACTIVE" })}
                            disabled={savingId === supplier.id}
                            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Reactivate
                          </button>
                        )}
                      {supplier.verificationStatus === "VERIFIED" &&
                        supplier.status !== "SUSPENDED" && (
                          <button
                            onClick={() => update(supplier.id, { supplierStatus: "SUSPENDED" })}
                            disabled={savingId === supplier.id}
                            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Ban className="h-3.5 w-3.5" /> Suspend
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
