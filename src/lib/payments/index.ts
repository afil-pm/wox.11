import {
  createOrder as razorpayCreateOrder,
  verifyPayment as razorpayVerifyPayment,
  createRefund as razorpayCreateRefund,
  type RazorpayOrder,
  type RazorpayPayment,
  type RazorpayRefund,
} from "./razorpay";

export type { RazorpayOrder, RazorpayPayment, RazorpayRefund };

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  signature?: string;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: string;
  error?: string;
}

export interface PaymentProvider {
  createOrder(
    amount: number,
    receipt: string,
    notes?: Record<string, string>
  ): Promise<PaymentOrder>;
  verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean>;
  processRefund(
    paymentId: string,
    amount?: number,
    notes?: Record<string, string>
  ): Promise<RefundResult>;
}

class RazorpayProvider implements PaymentProvider {
  async createOrder(
    amount: number,
    receipt: string,
    notes?: Record<string, string>
  ): Promise<PaymentOrder> {
    const order: RazorpayOrder = await razorpayCreateOrder(
      amount,
      receipt,
      notes
    );
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    };
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    return razorpayVerifyPayment(orderId, paymentId, signature);
  }

  async processRefund(
    paymentId: string,
    amount?: number,
    notes?: Record<string, string>
  ): Promise<RefundResult> {
    try {
      const refund: RazorpayRefund = await razorpayCreateRefund(
        paymentId,
        amount,
        notes
      );
      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Refund failed",
      };
    }
  }
}

const providers: Record<string, () => PaymentProvider> = {
  razorpay: () => new RazorpayProvider(),
};

const DEFAULT_PROVIDER = "razorpay";

/**
 * Get a payment provider instance.
 * @param providerName - The name of the payment provider (defaults to "razorpay")
 * @returns PaymentProvider implementation
 */
export function getPaymentProvider(
  providerName: string = DEFAULT_PROVIDER
): PaymentProvider {
  const factory = providers[providerName];
  if (!factory) {
    throw new Error(
      `Payment provider "${providerName}" is not supported. Available: ${Object.keys(providers).join(", ")}`
    );
  }
  return factory();
}

/**
 * Get the default payment provider.
 * @returns The default PaymentProvider implementation
 */
export function getDefaultPaymentProvider(): PaymentProvider {
  return getPaymentProvider(DEFAULT_PROVIDER);
}
