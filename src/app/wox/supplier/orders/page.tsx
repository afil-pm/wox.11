"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import WoxLoader from "@/components/ui/wox-loader";
import { supplierFetch } from "@/lib/supplier-api";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  slug: string;
}

interface SupplierOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string | null;
  deliveredAt: string | null;
  customerName: string;
  customerPhone: string;
  address: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  } | null;
  items: OrderItem[];
  supplierSubtotal: number;
  units: number;
  orderTotal: number;
}

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "RETURNED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

const STATUSES = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  PACKED: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-cyan-100 text-cyan-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  RETURNED: "bg-gray-200 text-gray-700",
  REFUNDED: "bg-gray-200 text-gray-700",
};

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<SupplierOrder[] | null>(null);
  const [status, setStatus] = useState("ALL");
  const [canUpdate, setCanUpdate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    supplierFetch("/api/wox/supplier/me")
      .then((r) => r.json())
      .then((data) => setCanUpdate(data?.supplier?.canUpdateOrderStatus === true))
      .catch(() => {});
  }, []);

  const load = useCallback(async (nextPage: number, nextStatus: string) => {
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: "20" });
      if (nextStatus && nextStatus !== "ALL") params.set("status", nextStatus);
      const res = await supplierFetch(`/api/wox/supplier/orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load orders");
        return;
      }
      setOrders(data.orders ?? []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setError("Failed to load orders");
    }
  }, []);

  useEffect(() => {
    load(page, status);
  }, [page, status, load]);

  async function updateStatus(order: SupplierOrder, nextStatus: string) {
    if (!nextStatus || nextStatus === order.status) return;
    setSavingId(order.id);
    setError("");
    try {
      const res = await supplierFetch(`/api/wox/supplier/orders/${order.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to update status");
        return;
      }
      setOrders((prev) =>
        (prev || []).map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o))
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Orders</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Only the items you supply are shown for each order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All statuses" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            onClick={() => load(page, status)}
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {orders === null ? (
        <div className="flex h-48 items-center justify-center">
          <WoxLoader />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-sm text-zinc-500">
          No orders found.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isOpen = expanded === order.id;
            const options = TRANSITIONS[order.status] || [];
            return (
              <div key={order.id} className="rounded-xl border bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">#{order.orderNumber}</p>
                      <p className="text-xs text-zinc-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : ""}
                        {" · "}
                        {order.units} item{order.units === 1 ? "" : "s"} · {order.customerName}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-900">
                      ₹{order.supplierSubtotal.toLocaleString("en-IN")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                    {canUpdate && options.length > 0 && (
                      <select
                        value=""
                        disabled={savingId === order.id}
                        onChange={(e) => updateStatus(order, e.target.value)}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-900"
                      >
                        <option value="">Update status…</option>
                        {options.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t px-4 py-4">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Your Items
                        </h3>
                        <ul className="space-y-2">
                          {order.items.map((item, i) => (
                            <li
                              key={`${item.slug}-${i}`}
                              className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-white">
                                  {item.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                                  ) : null}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                                  <p className="text-xs text-zinc-500">
                                    Size {item.size} · ₹{item.price} × {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm font-medium text-zinc-900">
                                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-zinc-500">
                          Order total ₹{order.orderTotal.toLocaleString("en-IN")} (store total,
                          including other suppliers&apos; items)
                        </p>
                      </div>

                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Delivery Details
                        </h3>
                        <div className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                          <p className="font-medium text-zinc-900">{order.customerName}</p>
                          <p>{order.customerPhone}</p>
                          {order.address && (
                            <p className="mt-1">
                              {order.address.line1}
                              {order.address.line2 ? `, ${order.address.line2}` : ""}
                              <br />
                              {order.address.city}
                              {order.address.landmark ? ` · ${order.address.landmark}` : ""}
                              <br />
                              {order.address.state} — {order.address.pincode}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-zinc-500">
                            Payment: {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
