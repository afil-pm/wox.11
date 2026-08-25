import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SIZE GUIDE",
};

const menSizes = [
  { size: "S", chest: "36-38", waist: "30-32", length: "27", shoulder: "17" },
  { size: "M", chest: "38-40", waist: "32-34", length: "28", shoulder: "18" },
  { size: "L", chest: "40-42", waist: "34-36", length: "29", shoulder: "19" },
  { size: "XL", chest: "42-44", waist: "36-38", length: "30", shoulder: "20" },
  { size: "XXL", chest: "44-46", waist: "38-40", length: "31", shoulder: "21" },
];

const boysSizes = [
  { size: "4-5Y", chest: "23-24", waist: "21-22", length: "18", shoulder: "11" },
  { size: "6-7Y", chest: "25-26", waist: "22-23", length: "20", shoulder: "12" },
  { size: "8-9Y", chest: "27-28", waist: "23-24", length: "22", shoulder: "13" },
  { size: "10-11Y", chest: "29-30", waist: "24-25", length: "24", shoulder: "14" },
  { size: "12-13Y", chest: "31-32", waist: "25-26", length: "26", shoulder: "15" },
  { size: "14-15Y", chest: "33-34", waist: "26-28", length: "28", shoulder: "16" },
];

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-900">
        SIZE GUIDE
      </h1>

      <div className="space-y-12">
        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-800">
            Men&apos;s Sizes
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            All measurements are in inches.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Chest
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Waist
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Length
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Shoulder
                  </th>
                </tr>
              </thead>
              <tbody>
                {menSizes.map((row) => (
                  <tr
                    key={row.size}
                    className="border-b border-zinc-100 hover:bg-zinc-50"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.size}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{row.chest}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.waist}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.length}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.shoulder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-800">
            Boys&apos; Sizes
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            All measurements are in inches.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Chest
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Waist
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Length
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Shoulder
                  </th>
                </tr>
              </thead>
              <tbody>
                {boysSizes.map((row) => (
                  <tr
                    key={row.size}
                    className="border-b border-zinc-100 hover:bg-zinc-50"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.size}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{row.chest}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.waist}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.length}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.shoulder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-800">
            How to Measure
          </h2>
          <ul className="space-y-3 text-sm text-zinc-600">
            <li>
              <span className="font-medium text-zinc-800">Chest:</span> Measure
              around the fullest part of your chest, keeping the tape level under
              your arms and across your shoulder blades.
            </li>
            <li>
              <span className="font-medium text-zinc-800">Waist:</span> Measure
              around your natural waistline, just above your hip bones. Keep the
              tape comfortably loose.
            </li>
            <li>
              <span className="font-medium text-zinc-800">Length:</span> Measure
              from the highest point of the shoulder down to the bottom hem.
            </li>
            <li>
              <span className="font-medium text-zinc-800">Shoulder:</span>{" "}
              Measure from one shoulder seam to the other across the back.
            </li>
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-zinc-800">
            Tips
          </h2>
          <ul className="space-y-3 text-sm text-zinc-600">
            <li>
              If you fall between sizes, we recommend sizing up for a more
              comfortable fit.
            </li>
            <li>
              Our garments are designed with a regular fit unless otherwise
              specified.
            </li>
            <li>
              For the most accurate fit, compare your measurements with our size
              chart rather than relying on standard size labels.
            </li>
            <li>
              If you need further assistance, feel free to{" "}
              <a href="/contact" className="underline hover:text-zinc-900">
                contact us
              </a>
              .
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
