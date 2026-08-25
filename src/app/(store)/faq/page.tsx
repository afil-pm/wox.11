"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: "Orders & Shipping",
    items: [
      {
        question: "How long does shipping take?",
        answer:
          "Standard shipping takes 5-7 business days for metro cities and 7-10 business days for other locations. Express shipping (2-3 business days) is available for an additional fee.",
      },
      {
        question: "How can I track my order?",
        answer:
          "Once your order is shipped, you will receive a tracking number via email. You can also track your order by logging into your WOX.11 account and viewing your order history.",
      },
      {
        question: "Can I change or cancel my order?",
        answer:
          "Orders can be modified or cancelled within 2 hours of placement. After this window, the order enters processing and cannot be changed. Please contact support@wox11.com for assistance.",
      },
    ],
  },
  {
    title: "Returns & Refunds",
    items: [
      {
        question: "What is your return policy?",
        answer:
          "You can return eligible items within 7 days of delivery. Items must be unworn, unwashed, and in original packaging with all tags attached. Final sale items cannot be returned.",
      },
      {
        question: "How long does a refund take?",
        answer:
          "After we receive your return, refunds are processed within 5-7 business days to your original payment method. Bank transfers may take 7-10 business days.",
      },
      {
        question: "Do I pay for return shipping?",
        answer:
          "If the return is due to our error (defective or wrong item), return shipping is free. For change-of-mind returns, a flat fee of ₹49 will be deducted from your refund.",
      },
    ],
  },
  {
    title: "Payments",
    items: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept UPI (Google Pay, PhonePe, Paytm), credit/debit cards (Visa, Mastercard, RuPay), net banking, and popular wallets. All transactions are secure and encrypted.",
      },
      {
        question: "Is Cash on Delivery (COD) available?",
        answer:
          "Yes, COD is available for orders under ₹5,000 in select cities. A ₹49 COD fee applies. COD may not be available during promotional periods.",
      },
      {
        question: "Are prices inclusive of taxes?",
        answer:
          "Yes, all prices displayed on our website are inclusive of GST. Shipping charges are calculated separately and displayed at checkout.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        question: "How do I create an account?",
        answer:
          'Click the "Sign Up" button in the top right corner and follow the registration process. You can also create an account during checkout.',
      },
      {
        question: "I forgot my password. What should I do?",
        answer:
          'Click "Forgot Password" on the sign-in page, enter your email address, and follow the instructions sent to your email to reset your password.',
      },
      {
        question: "How do I update my personal information?",
        answer:
          "Log in to your account, go to My Account, and select Profile. You can update your name, email, phone number, and addresses from there.",
      },
    ],
  },
  {
    title: "Products",
    items: [
      {
        question: "How do I find my size?",
        answer:
          "Each product page includes a detailed size guide. Measure yourself and compare with our size chart for the best fit. If you're between sizes, we recommend sizing up.",
      },
      {
        question: "Are your products true to color?",
        answer:
          "We make every effort to display colors accurately. However, colors may vary slightly due to screen settings and lighting conditions during photography.",
      },
      {
        question: "How should I care for my WOX.11 clothing?",
        answer:
          "We recommend machine washing in cold water with like colors, tumble drying on low, and ironing on medium heat. Avoid bleach and dry cleaning for best results.",
      },
    ],
  },
];

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-zinc-200 border-y border-zinc-200">
      {items.map((item, index) => (
        <div key={index}>
          <button
            type="button"
            className="flex w-full items-center justify-between py-4 text-left"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="text-sm font-medium text-zinc-900">
              {item.question}
            </span>
            <span className="ml-4 flex-shrink-0">
              {openIndex === index ? (
                <Minus className="h-4 w-4 text-zinc-500" />
              ) : (
                <Plus className="h-4 w-4 text-zinc-500" />
              )}
            </span>
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              openIndex === index ? "max-h-96 pb-4" : "max-h-0"
            )}
          >
            <p className="text-sm leading-relaxed text-zinc-600">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-zinc-900 sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-sm text-zinc-500">
          Find answers to common questions about our products and services.
        </p>

        {/* Category Tabs */}
        <div className="mt-10 flex flex-wrap gap-2">
          {faqData.map((category, index) => (
            <button
              key={category.title}
              type="button"
              onClick={() => setActiveCategory(index)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors",
                activeCategory === index
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
              )}
            >
              {category.title}
            </button>
          ))}
        </div>

        {/* FAQ Content */}
        <div className="mt-8">
          <FAQAccordion items={faqData[activeCategory].items} />
        </div>

        {/* Contact CTA */}
        <div className="mt-12 rounded-xl border border-zinc-200 p-6 text-center sm:p-8">
          <h2 className="text-lg font-semibold text-zinc-900">
            Still have questions?
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Our support team is here to help. Reach out to us anytime.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:support@wox11.com"
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Email Support
            </a>
            <a
              href="tel:+919876543210"
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
