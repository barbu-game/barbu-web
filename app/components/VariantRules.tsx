"use client";

import type { Variant } from "../lib/variants";

export default function VariantRules({ variant }: { variant: Variant }) {
  return (
    <div className="p-5">
      <p className="mb-4 text-sm text-muted-fg">{variant.description}</p>
      <ol className="divide-y divide-border">
        {variant.contracts.map((c, i) => (
          <li key={c.key} className="flex items-baseline gap-3 py-2.5 text-sm">
            <span className="w-4 shrink-0 tabular-nums text-muted-fg">{i + 1}</span>
            <span className="min-w-0 flex-1">{c.title}</span>
            <span className="text-right text-xs text-gold-soft/90">{c.rule}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
