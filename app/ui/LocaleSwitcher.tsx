"use client";

import { useLocale } from "../lib/i18n";
import { cn } from "../lib/cn";

export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="flex overflow-hidden rounded-full border border-border bg-surface text-xs font-semibold">
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "px-3 py-2 uppercase transition",
            locale === l ? "bg-gold-soft text-[#3a1e02]" : "text-muted-fg hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
