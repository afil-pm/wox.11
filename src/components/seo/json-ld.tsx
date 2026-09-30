import { headers } from "next/headers";
import { serializeJsonLd } from "@/lib/security/jsonld";

/**
 * Structured data is a data block rather than an executable script, so CSP
 * does not have to allow it — but it is rendered with the request nonce
 * anyway, so no browser that treats it as a script can block it.
 */
export default async function JsonLd({ data }: { data: Record<string, unknown> | object }) {
  const nonce = (await headers()).get("x-nonce") || "";

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
