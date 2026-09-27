export const paymentLabels: Record<string, string> = {
  PENDING: "Payment Pending",
  PAYMENT_PROCESSING: "Payment Processing",
  PAID: "Paid",
  COMPLETED: "Paid",
  FAILED: "Payment Failed",
  CANCELLED: "Payment Cancelled",
  REVIEW: "Payment in Review",
  REFUNDED: "Refunded",
};

export const paymentStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAYMENT_PROCESSING: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  REVIEW: "bg-orange-100 text-orange-800",
  REFUNDED: "bg-blue-100 text-blue-800",
};

export function isPaidPaymentStatus(status?: string): boolean {
  return status === "PAID" || status === "COMPLETED" || status === "REFUNDED";
}
