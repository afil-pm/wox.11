/**
 * Serialises structured data for an `application/ld+json` script tag.
 *
 * `JSON.stringify` output is placed inside an HTML `<script>` element, where
 * `</script` (and even `<!--`) in a string value would terminate the element
 * early and let the remainder be parsed as markup. Escaping `<`, `>` and `&`
 * as JSON unicode escapes keeps the payload valid JSON while making it
 * impossible to break out of the tag.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data ?? null)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
