"use client";

import type { Variant } from "../lib/variants";

export default function VariantRules({ variant }: { variant: Variant }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="mb-2 text-xs text-muted-fg">{variant.description}</p>
      <ol className="space-y-1">
        {variant.contracts.map((c, i) => (
          <li key={c.key} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-foreground">
              <span className="mr-2 text-muted-fg">{i + 1}.</span>
              {c.title}
            </span>
            <span className="text-right font-mono text-xs text-gold-soft/80">{c.rule}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
