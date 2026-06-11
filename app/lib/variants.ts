const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Mirrors the OpenAPI Variant / VariantContract schemas exposed by GET /variants.
// TODO: replace with the generated type from @barbu-game/barbu-api once republished.
export type VariantContract = { key: string; title: string; rule: string };
export type Variant = { id: string; name: string; description: string; contracts: VariantContract[] };

export async function fetchVariants(): Promise<Variant[]> {
  const res = await fetch(`${API}/variants`);
  if (!res.ok) throw new Error(`Failed to load variants (${res.status})`);
  return res.json();
}

/** A flat key -> title map across all variants (for labelling contracts in the UI). */
export function contractTitles(variants: Variant[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const v of variants) {
    for (const c of v.contracts) map[c.key] = c.title;
  }
  return map;
}
