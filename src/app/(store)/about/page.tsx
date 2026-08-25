import type { Metadata } from "next";
import { Leaf, Recycle, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | WOX.11",
};

const values = [
  {
    icon: Leaf,
    title: "Sustainability",
    description:
      "We are committed to minimizing our environmental impact through responsible sourcing and eco-friendly packaging.",
  },
  {
    icon: Recycle,
    title: "Quality Over Quantity",
    description:
      "Each piece is crafted to last, reducing waste and promoting mindful consumption.",
  },
  {
    icon: Heart,
    title: "Community First",
    description:
      "We support local artisans and communities, ensuring fair wages and ethical working conditions.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-zinc-950 px-4 py-20 text-center sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl">
            The Story of WOX.11
          </h1>
          <p className="mt-6 text-lg font-light text-zinc-400">
            Modern essentials crafted for those who value simplicity, quality,
            and timeless style.
          </p>
        </div>
      </section>

      {/* Brand Story */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl space-y-6 text-sm leading-relaxed text-zinc-600">
          <p>
            WOX.11 was born from a simple idea: create well-made, essential
            clothing that doesn&apos;t compromise on quality or style. Based in
            Mumbai, we design for the modern Indian man and boy who appreciates
            clean aesthetics and lasting craftsmanship.
          </p>
          <p>
            Our name represents our philosophy — <strong className="text-zinc-900">W</strong>ear{" "}
            <strong className="text-zinc-900">O</strong>ur{" "}
            <strong className="text-zinc-900">X</strong>perience, mark{" "}
            <strong className="text-zinc-900">11</strong> for excellence. Every
            stitch, every fabric choice, and every design decision is made with
            intention.
          </p>
          <p>
            From our premium cotton t-shirts to our tailored shirts and
            versatile pants, each piece in our collection is designed to be a
            foundation of your everyday wardrobe — pieces you reach for again
            and again, because they simply work.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-zinc-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-zinc-900 sm:text-3xl">
            Our Mission
          </h2>
          <p className="mt-6 text-lg text-zinc-600">
            To provide premium, essential clothing that empowers individuals to
            feel confident and comfortable in their everyday lives — without the
            premium price tag.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold uppercase tracking-wider text-zinc-900 sm:text-3xl">
            Our Values
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <value.icon
                  className="mx-auto h-8 w-8 text-zinc-900"
                  strokeWidth={1.5}
                />
                <h3 className="mt-4 text-sm font-semibold uppercase tracking-wider text-zinc-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Commitment */}
      <section className="bg-zinc-950 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-white sm:text-3xl">
            Quality Commitment
          </h2>
          <div className="mt-8 space-y-4 text-sm leading-relaxed text-zinc-400">
            <p>
              Every WOX.11 product undergoes rigorous quality checks before it
              reaches you. We source the finest materials from trusted suppliers
              and work with skilled craftspeople who share our passion for
              excellence.
            </p>
            <p>
              We stand behind the quality of our products. If you&apos;re not
              completely satisfied with your purchase, our customer support team
              is here to make it right.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
