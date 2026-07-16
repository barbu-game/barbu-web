import type { Variant, VariantContract } from "@barbu-game/barbu-api";

// Types come from the generated contract; the typecheck breaks if GET /variants drifts.
// We keep an explicit fetch (rather than the generated `list()`) so it targets the
// cross-origin API base in dev instead of a relative URL.
export type { Variant, VariantContract };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// The rule text is localised server-side from Accept-Language, so pass the UI locale through.
export async function fetchVariants(locale?: string): Promise<Variant[]> {
  const res = await fetch(`${API}/variants`, {
    headers: locale ? { "Accept-Language": locale } : undefined,
  });
  if (!res.ok) throw new Error(`Failed to load variants (${res.status})`);
  return res.json();
}
