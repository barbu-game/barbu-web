"use client";

import { useEffect, useState } from "react";
import type { RatingServiceLeaderboardRow } from "@barbu-game/barbu-api";
import { useT } from "../lib/i18n";
import Panel from "../ui/Panel";
import { cn } from "../lib/cn";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function Leaderboard() {
  const t = useT();
  const [rows, setRows] = useState<RatingServiceLeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/leaderboard?limit=20`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: RatingServiceLeaderboardRow[]) => setRows(data))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return null;
  if (rows.length === 0) return null;

  return (
    <Panel className="mx-auto mt-6 w-full max-w-md p-6 shadow-2xl">
      <h2 className="mb-3 text-center font-display text-sm font-semibold uppercase tracking-widest text-muted-fg">
        {t("leaderboard.title")}
      </h2>
      <ol className="space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.rank}
            className={cn(
              "flex items-center justify-between rounded-lg border px-3 py-1.5",
              r.rank === 1 ? "border-gold-soft/50 bg-gold/15" : "border-border bg-surface",
            )}
          >
            <span className="flex items-center gap-2 text-sm text-foreground">
              <span className={r.rank === 1 ? "text-gold-soft" : "text-muted-fg"}>#{r.rank}</span>
              {r.username}
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span className="font-semibold tabular-nums text-gold-soft">{r.rating}</span>
              <span className="text-xs text-muted-fg">{t("leaderboard.games", { n: r.gamesPlayed })}</span>
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
