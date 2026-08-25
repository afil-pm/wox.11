import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | WOX.11",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-zinc-900 sm:text-4xl">
          Refund Policy
        </h1>
        <p className="mt-4 text-sm text-zinc-500">
          Last updated: August 25, 2026
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-zinc-600">
          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Eligibility for Refund
            </h2>
            <p className="mb-3">
              We want you to be completely satisfied with your purchase. You are
              eligible for a full refund if:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                The item is defective, damaged, or significantly different from
                the product description
              </li>
              <li>You received the wrong item</li>
              <li>The item was lost during shipping</li>
            </ul>
            <p className="mt-3">
              You may also request a refund for change of mind within 7 days of
              delivery, provided the item is unworn, unwashed, and in its
              original packaging with all tags attached.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Refund Process
            </h2>
            <ol className="list-inside list-decimal space-y-3">
              <li>
                Log in to your WOX.11 account and navigate to your order history
              </li>
              <li>Select the order containing the item you wish to return</li>
              <li>Click &quot;Request Return&quot; and select the reason</li>
              <li>
                Print the prepaid return shipping label (if applicable) or
                arrange your own shipping
              </li>
              <li>
                Pack the item securely and ship it using the provided label or
                your own method
              </li>
              <li>
                Once we receive and inspect the item, we will process your
                refund
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Refund Timeline
            </h2>
            <p className="mb-3">
              After we receive your return, please allow:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong className="text-zinc-900">1-2 business days</strong> for
                inspection and processing
              </li>
              <li>
                <strong className="text-zinc-900">5-7 business days</strong> for
                the refund to appear on your original payment method
              </li>
              <li>
                <strong className="text-zinc-900">7-10 business days</strong> for
                bank transfers and UPI refunds
              </li>
            </ul>
            <p className="mt-3">
              You will receive an email notification once your refund has been
              processed. Please note that your bank or payment provider may
              require additional time to post the credit.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Non-Refundable Items
            </h2>
            <p className="mb-3">
              The following items are not eligible for refunds:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>Items that have been worn, washed, or altered</li>
              <li>Items without original tags or packaging</li>
              <li>Items marked as &quot;Final Sale&quot; or &quot;Non-Returnable&quot;</li>
              <li>Gift cards and vouchers</li>
              <li>Undergarments and innerwear (for hygiene reasons)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Contact for Refunds
            </h2>
            <p className="mb-3">
              If you have any questions about our refund policy or need
              assistance with a return, please contact us:
            </p>
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-zinc-900">WOX.11 Customer Support</p>
              <p>Email: support@wox11.com</p>
              <p>Phone: +91 98765 43210</p>
              <p>
                Address: 15th Floor, Tech Tower, BKC, Mumbai, Maharashtra
                400051, India
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
