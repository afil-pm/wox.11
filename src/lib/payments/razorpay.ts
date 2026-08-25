import crypto from "crypto";

export interface RazorpayOrder {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status:
    | "created"
    | "authorized"
    | "captured"
    | "refunded"
    | "failed";
  order_id: string;
  method: string;
  description?: string;
  captured: boolean;
  created_at: number;
}

export interface RazorpayRefund {
  id: string;
  entity: "refund";
  amount: number;
  currency: string;
  payment_id: string;
  status: "pending" | "processed" | "failed";
  created_at: number;
}

interface RazorpayError {
  error: {
    code: string;
    description: string;
    field?: string;
  };
}

function getKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new Error("RAZORPAY_KEY_ID environment variable is not set");
  return keyId;
}

function getKeySecret(): string {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error("RAZORPAY_KEY_SECRET environment variable is not set");
  return keySecret;
}

function getWebhookSecret(): string {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("RAZORPAY_WEBHOOK_SECRET environment variable is not set");
  return webhookSecret;
}

function getAuthHeader(): string {
  const credentials = Buffer.from(`${getKeyId()}:${getKeySecret()}`).toString("base64");
  return `Basic ${credentials}`;
}

/**
 * Create a Razorpay order for payment processing.
 * @param amount - Amount in paise (INR smallest unit)
 * @param receipt - Unique receipt identifier
 * @param notes - Optional metadata notes
 * @returns Created Razorpay order
 */
export async function createOrder(
  amount: number,
  receipt: string,
  notes?: Record<string, string>
): Promise<RazorpayOrder> {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt,
      notes,
    }),
  });

  const data = (await response.json()) as RazorpayOrder | RazorpayError;

  if (!response.ok) {
    const error = data as RazorpayError;
    throw new Error(
      `Razorpay createOrder failed: ${error.error.description}`
    );
  }

  return data as RazorpayOrder;
}

/**
 * Verify a Razorpay payment signature after checkout.
 * @param razorpayOrderId - The order ID from Razorpay
 * @param razorpayPaymentId - The payment ID from Razorpay
 * @param razorpaySignature - The signature from Razorpay checkout
 * @returns Whether the payment signature is valid
 */
export function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", getKeySecret())
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return expectedSignature === razorpaySignature;
}

/**
 * Verify a Razorpay webhook signature to ensure authenticity.
 * @param body - Raw request body string
 * @param signature - The X-Razorpay-Signature header value
 * @returns Whether the webhook signature is valid
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", getWebhookSecret())
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * Create a refund for a Razorpay payment.
 * @param paymentId - The Razorpay payment ID to refund
 * @param amount - Amount in paise to refund (optional, full refund if omitted)
 * @param notes - Optional metadata notes
 * @returns Created Razorpay refund
 */
export async function createRefund(
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>
): Promise<RazorpayRefund> {
  const body: Record<string, unknown> = {};
  if (amount !== undefined) body.amount = amount;
  if (notes !== undefined) body.notes = notes;

  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = (await response.json()) as RazorpayRefund | RazorpayError;

  if (!response.ok) {
    const error = data as RazorpayError;
    throw new Error(
      `Razorpay createRefund failed: ${error.error.description}`
    );
  }

  return data as RazorpayRefund;
}

/**
 * Fetch a Razorpay payment by ID.
 * @param paymentId - The Razorpay payment ID
 * @returns Razorpay payment details
 */
export async function getPaymentById(
  paymentId: string
): Promise<RazorpayPayment> {
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${paymentId}`,
    {
      headers: {
        Authorization: getAuthHeader(),
      },
    }
  );

  const data = (await response.json()) as RazorpayPayment | RazorpayError;

  if (!response.ok) {
    const error = data as RazorpayError;
    throw new Error(
      `Razorpay getPayment failed: ${error.error.description}`
    );
  }

  return data as RazorpayPayment;
}
