import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | WOX.11",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-zinc-900 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-zinc-500">
          Last updated: August 25, 2026
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-zinc-600">
          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Acceptance of Terms
            </h2>
            <p>
              By accessing or using the WOX.11 website and services, you agree
              to be bound by these Terms of Service. If you do not agree to
              these terms, please do not use our website or services. We reserve
              the right to modify these terms at any time, and your continued
              use of the website constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Account Registration
            </h2>
            <p className="mb-3">
              To access certain features, you may need to create an account. You
              are responsible for maintaining the confidentiality of your account
              credentials and for all activities that occur under your account.
            </p>
            <p>
              You agree to provide accurate, current, and complete information
              during registration and to update such information as necessary. We
              reserve the right to suspend or terminate accounts that violate
              these terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Products and Pricing
            </h2>
            <p className="mb-3">
              We strive to display accurate product descriptions, images, and
              pricing. However, errors may occur. We reserve the right to correct
              any errors, inaccuracies, or omissions and to change or update
              information at any time without prior notice.
            </p>
            <p>
              All prices are listed in Indian Rupees (INR) and are inclusive of
              applicable taxes unless otherwise stated. Prices do not include
              shipping charges, which are calculated at checkout.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Orders and Payments
            </h2>
            <p className="mb-3">
              By placing an order, you are making an offer to purchase products
              subject to these terms. We reserve the right to accept or decline
              any order at our discretion.
            </p>
            <p className="mb-3">
              Payment must be received in full before an order is processed. We
              accept various payment methods as displayed at checkout. All
              transactions are processed through secure payment gateways.
            </p>
            <p>
              We reserve the right to cancel orders in cases of suspected fraud,
              pricing errors, or unavailability of products.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Shipping and Delivery
            </h2>
            <p className="mb-3">
              We aim to process and ship orders within 2-3 business days.
              Delivery times vary based on location and shipping method selected
              at checkout. Estimated delivery dates are provided for reference
              and are not guaranteed.
            </p>
            <p>
              Risk of loss and title for items pass to you upon delivery to the
              carrier. We are not responsible for delays caused by the shipping
              carrier or customs processing.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Returns and Refunds
            </h2>
            <p className="mb-3">
              You may return eligible items within 7 days of delivery for a
              refund or exchange. Items must be unworn, unwashed, and in their
              original packaging with all tags attached.
            </p>
            <p>
              Refunds will be processed to the original payment method within
              5-7 business days after we receive and inspect the returned items.
              Shipping charges are non-refundable unless the return is due to
              our error.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, WOX.11 shall not be liable
              for any indirect, incidental, special, consequential, or punitive
              damages arising from your use of our website or products. Our total
              liability shall not exceed the amount paid by you for the product
              in question.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Governing Law
            </h2>
            <p>
              These Terms of Service are governed by and construed in accordance
              with the laws of India. Any disputes arising under these terms
              shall be subject to the exclusive jurisdiction of the courts in
              Mumbai, Maharashtra.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Contact
            </h2>
            <p className="mb-3">
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-zinc-900">WOX.11 Support</p>
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
