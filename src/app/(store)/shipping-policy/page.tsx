import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy | WOX.11",
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-zinc-900 sm:text-4xl">
          Shipping Policy
        </h1>
        <p className="mt-4 text-sm text-zinc-500">
          Last updated: August 25, 2026
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-zinc-600">
          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Shipping Areas
            </h2>
            <p className="mb-3">
              We currently ship to all addresses within India. This includes
              all major cities, towns, and rural areas served by our logistics
              partners. We are working to expand our shipping coverage to serve
              more locations.
            </p>
            <p>
              We do not ship to P.O. Box addresses. Please provide a complete
              street address for reliable delivery.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Shipping Rates
            </h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-zinc-200 p-4">
                <p className="font-medium text-zinc-900">Standard Shipping</p>
                <p>Free on orders above ₹999 | ₹49 for orders below ₹999</p>
                <p className="mt-1 text-zinc-500">
                  Delivery within 5-7 business days
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4">
                <p className="font-medium text-zinc-900">Express Shipping</p>
                <p>₹149 on all orders</p>
                <p className="mt-1 text-zinc-500">
                  Delivery within 2-3 business days
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4">
                <p className="font-medium text-zinc-900">
                  Same-Day Delivery
                </p>
                <p>₹299 on all orders (Mumbai only)</p>
                <p className="mt-1 text-zinc-500">
                  Delivery within the same day for orders placed before 12 PM
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Delivery Times
            </h2>
            <p className="mb-3">
              Estimated delivery times are calculated from the date of order
              confirmation:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong className="text-zinc-900">Metro Cities</strong> (Mumbai,
                Delhi, Bangalore, Chennai, Kolkata, Hyderabad): 2-5 business
                days
              </li>
              <li>
                <strong className="text-zinc-900">Tier 2 Cities</strong>: 3-7
                business days
              </li>
              <li>
                <strong className="text-zinc-900">Tier 3 Cities &amp; Rural
                Areas</strong>: 5-10 business days
              </li>
            </ul>
            <p className="mt-3">
              Please note that delivery times may be affected by holidays,
              weather conditions, and unforeseen circumstances. We will notify
              you promptly of any significant delays.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Order Tracking
            </h2>
            <p className="mb-3">
              Once your order has been shipped, you will receive a confirmation
              email with a tracking number. You can track your order:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>Through the link provided in your shipping confirmation email</li>
              <li>
                By logging into your WOX.11 account and viewing your order
                history
              </li>
              <li>By contacting our customer support team</li>
            </ul>
            <p className="mt-3">
              Tracking information may take 24-48 hours to become available after
              shipping.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              International Shipping
            </h2>
            <p className="mb-3">
              We currently do not offer international shipping. We are
              evaluating options to expand our services globally. Sign up for our
              newsletter to be notified when international shipping becomes
              available.
            </p>
            <p>
              For any questions about shipping, please contact our support team
              at support@wox11.com or call us at +91 98765 43210.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
