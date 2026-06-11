"use client";

import type { Variant } from "../lib/variants";

export default function VariantRules({ variant }: { variant: Variant }) {
  return (
    <div className="rounded-lg bg-slate-800/60 p-3 ring-1 ring-white/10">
      <p className="mb-2 text-xs text-slate-400">{variant.description}</p>
      <ol className="space-y-1">
        {variant.contracts.map((c, i) => (
          <li key={c.key} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-slate-200">
              <span className="mr-2 text-slate-500">{i + 1}.</span>
              {c.title}
            </span>
            <span className="text-right font-mono text-xs text-amber-300/80">{c.rule}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
