import type { Variant, VariantContract } from "@barbu-game/barbu-api";

// Types come from the generated contract; the typecheck breaks if GET /variants drifts.
// We keep an explicit fetch (rather than the generated `list()`) so it targets the
// cross-origin API base in dev instead of a relative URL.
export type { Variant, VariantContract };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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
