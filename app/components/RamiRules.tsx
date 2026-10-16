"use client";

import { useT, type TranslationKey } from "../lib/i18n";

const SECTIONS = ["deal", "melds", "opening", "turn", "jokers", "end", "scoring"] as const;

export default function RamiRules() {
  const t = useT();
  return (
    <div className="p-5" data-testid="rami-rules">
      <p className="mb-4 text-sm text-muted-fg">{t("ramiRules.intro")}</p>
      <ol className="divide-y divide-border">
        {SECTIONS.map((key) => (
          <li key={key} className="py-2.5 text-sm">
            <p className="font-medium">{t(`ramiRules.${key}.title` as TranslationKey)}</p>
            <p className="mt-0.5 text-muted-fg">{t(`ramiRules.${key}.body` as TranslationKey)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
