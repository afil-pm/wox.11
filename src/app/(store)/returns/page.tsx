import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RETURNS & EXCHANGES",
};

const steps = [
  {
    step: 1,
    title: "Initiate a Return",
    description:
      "Log in to your account, go to your order history, and select the item you wish to return. Follow the prompts to generate a return request.",
  },
  {
    step: 2,
    title: "Pack Your Item",
    description:
      "Place the item in its original packaging with all tags attached. Include the return slip inside the package.",
  },
  {
    step: 3,
    title: "Ship It Back",
    description:
      "Use the prepaid shipping label provided with your return confirmation email. Drop off the package at your nearest shipping location.",
  },
  {
    step: 4,
    title: "Refund Processed",
    description:
      "Once we receive and inspect your return, your refund will be processed within 5-7 business days to your original payment method.",
  },
];

const eligibility = [
  "Items must be returned within 30 days of delivery.",
  "Items must be unworn, unwashed, and in original condition with all tags attached.",
  "Items must be in their original packaging.",
  "Final sale items and accessories are not eligible for return.",
  "Items purchased with a discount code are eligible for return at the discounted price.",
  "Free gifts or promotional items must be returned alongside the purchased item.",
];

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-900">
        RETURNS & EXCHANGES
      </h1>

      <div className="space-y-12">
        <section>
          <p className="mb-6 text-zinc-600">
            We want you to be completely satisfied with your purchase. If
            something isn&apos;t right, we&apos;re here to help. Below you&apos;ll
            find everything you need to know about our returns and exchange
            policy.
          </p>
        </section>

        <section>
          <h2 className="mb-6 text-xl font-semibold text-zinc-800">
            Return Process
          </h2>
          <div className="space-y-6">
            {steps.map((item) => (
              <div
                key={item.step}
                className="flex gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="mb-1 font-medium text-zinc-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-xl font-semibold text-zinc-800">
            Eligibility Criteria
          </h2>
          <ul className="space-y-3">
            {eligibility.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-sm text-zinc-600"
              >
                <span className="mt-0.5 text-zinc-400">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-800">
            Exchanges
          </h2>
          <p className="text-sm text-zinc-600">
            We currently offer size exchanges for the same item. If you need a
            different size, please initiate a return for a refund and place a new
            order for the correct size. This ensures you receive your preferred
            item as quickly as possible.
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-800">
            Need Help?
          </h2>
          <p className="text-sm text-zinc-600">
            If you have any questions about returns or exchanges, our support
            team is here to assist you.{" "}
            <a href="/contact" className="underline hover:text-zinc-900">
              Contact us
            </a>{" "}
            and we&apos;ll get back to you as soon as possible.
          </p>
        </section>
      </div>
    </div>
  );
}
