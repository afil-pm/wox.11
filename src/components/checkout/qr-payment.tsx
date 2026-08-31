"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import { CheckCircle2, Clock, XCircle, RefreshCw, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

interface QrPaymentProps {
  amount: number;
  orderNumber: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  customerName: string;
  customerPhone: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
}

type PaymentStatus = "generating" | "waiting" | "verifying" | "success" | "failed" | "expired";

const POLL_INTERVAL = 4000;
const EXPIRY_SECONDS = 300;

export default function QrPayment({
  amount,
  orderNumber,
  razorpayOrderId,
  razorpayKeyId,
  customerName,
  customerPhone,
  onSuccess,
  onFailure,
}: QrPaymentProps) {
  const [status, setStatus] = useState<PaymentStatus>("generating");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS);
  const [errorMessage, setErrorMessage] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const upiId = process.env.NEXT_PUBLIC_UPI_ID || "";
  const merchantName = process.env.NEXT_PUBLIC_MERCHANT_NAME || "WOX.11";

  const generateQr = useCallback(async () => {
    if (!upiId) {
      setErrorMessage("UPI ID not configured. Please use card payment instead.");
      setStatus("failed");
      return;
    }

    setStatus("generating");
    setErrorMessage("");
    setTimeLeft(EXPIRY_SECONDS);

    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order ${orderNumber}`)}`;

    try {
      const dataUrl = await QRCode.toDataURL(upiString.toUpperCase(), {
        width: 280,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(dataUrl);
      setStatus("waiting");
    } catch {
      setErrorMessage("Failed to generate QR code. Please try again.");
      setStatus("failed");
    }
  }, [amount, orderNumber, upiId, merchantName]);

  const checkPayment = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments/verify-qr?orderId=${razorpayOrderId}`);
      const data = await res.json();

      if (data.status === "paid") {
        setStatus("success");
        onSuccess(data.paymentId || "");
      } else if (data.status === "failed") {
        setStatus("failed");
        setErrorMessage("Payment failed. Please try again.");
      }
    } catch {
      // keep polling
    }
  }, [razorpayOrderId, onSuccess]);

  useEffect(() => {
    generateQr();
  }, [generateQr]);

  useEffect(() => {
    if (status === "waiting") {
      pollRef.current = setInterval(checkPayment, POLL_INTERVAL);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setStatus("expired");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, checkPayment]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-zinc-900">Payment Successful</h3>
        <p className="mt-1 text-sm text-zinc-500">Your payment of {formatPrice(amount)} has been received.</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-zinc-900">Payment Failed</h3>
        <p className="mt-1 text-sm text-zinc-500">{errorMessage || "Something went wrong."}</p>
        <Button
          className="mt-4 bg-zinc-900 text-white hover:bg-zinc-800"
          onClick={generateQr}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-zinc-900">QR Code Expired</h3>
        <p className="mt-1 text-sm text-zinc-500">The payment session has timed out.</p>
        <Button
          className="mt-4 bg-zinc-900 text-white hover:bg-zinc-800"
          onClick={generateQr}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate New QR Code
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {status === "generating" ? (
        <div className="flex flex-col items-center py-8">
          <div className="h-[280px] w-[280px] animate-pulse rounded-xl bg-zinc-100" />
          <p className="mt-3 text-xs text-zinc-400">Generating QR code...</p>
        </div>
      ) : (
        <>
          <div className="relative rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <img
              src={qrDataUrl}
              alt={`Scan to pay ${formatPrice(amount)}`}
              width={280}
              height={280}
              className="block"
            />
            {timeLeft <= 60 && status === "waiting" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
                <div className="text-center">
                  <Clock className="mx-auto h-8 w-8 text-amber-500" />
                  <p className="mt-2 text-sm font-medium text-amber-700">
                    Expiring in {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <QrCode className="h-3.5 w-3.5" />
            <span>Scan with any UPI app</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              status === "waiting" ? "animate-pulse bg-green-500" : "bg-zinc-300"
            )} />
            <span className="text-xs text-zinc-500">
              {status === "verifying"
                ? "Verifying payment..."
                : `Waiting for payment · ${formatTime(timeLeft)}`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
