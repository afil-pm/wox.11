import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | WOX.11",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-zinc-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-zinc-500">
          Last updated: August 25, 2026
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-zinc-600">
          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Information We Collect
            </h2>
            <p className="mb-3">
              At WOX.11, we collect information you provide directly to us when
              you create an account, make a purchase, or contact our support
              team. This may include your name, email address, phone number,
              shipping address, and payment information.
            </p>
            <p>
              We automatically collect certain information when you visit our
              website, including your IP address, browser type, operating system,
              referring URLs, and browsing behavior on our site.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              How We Use Your Information
            </h2>
            <ul className="list-inside list-disc space-y-2">
              <li>To process and fulfill your orders</li>
              <li>To communicate with you about your orders and account</li>
              <li>To provide customer support</li>
              <li>To send promotional communications (with your consent)</li>
              <li>To improve our website and services</li>
              <li>To detect and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Sharing Your Information
            </h2>
            <p className="mb-3">
              We do not sell your personal information. We may share your
              information with third-party service providers who assist us in
              operating our website, processing payments, and delivering orders.
              These providers are contractually obligated to protect your data.
            </p>
            <p>
              We may also share information when required by law or to protect
              the rights, property, or safety of WOX.11, our customers, or
              others.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Data Security
            </h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. All payment transactions
              are encrypted using SSL technology. However, no method of
              transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Your Rights
            </h2>
            <p className="mb-3">
              Under Indian data protection laws, you have the right to access,
              correct, or delete your personal information. You may also opt out
              of receiving marketing communications from us at any time.
            </p>
            <p>
              To exercise these rights, please contact us at
              privacy@wox11.com.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Cookies
            </h2>
            <p className="mb-3">
              We use cookies and similar tracking technologies to enhance your
              browsing experience, analyze site traffic, and personalize content.
              You can control cookies through your browser settings.
            </p>
            <p>
              Essential cookies required for the functioning of the website
              cannot be disabled. Optional cookies used for analytics and
              marketing can be managed through our cookie consent banner.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy on
              this page and updating the &quot;Last updated&quot; date. Your
              continued use of our website after any changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-zinc-900">
              Contact Us
            </h2>
            <p className="mb-3">
              If you have any questions about this Privacy Policy, please
              contact us:
            </p>
            <div className="rounded-lg border border-zinc-200 p-4">
              <p className="text-zinc-900">WOX.11 Privacy Team</p>
              <p>Email: privacy@wox11.com</p>
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
