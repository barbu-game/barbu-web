"use client";

import { useLocale } from "../lib/i18n";
import { cn } from "../lib/cn";

export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="flex rounded-lg border border-border p-0.5 text-xs font-medium">
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "h-7 rounded-md px-2.5 uppercase transition-colors",
            locale === l ? "bg-white/10 text-foreground" : "text-muted-fg hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
