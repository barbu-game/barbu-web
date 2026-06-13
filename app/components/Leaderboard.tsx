"use client";

import { useEffect, useState } from "react";
import type { RatingServiceLeaderboardRow } from "@barbu-game/barbu-api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function Leaderboard() {
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
    <div className="mx-auto mt-6 w-full max-w-md rounded-2xl bg-slate-900/70 p-6 shadow-2xl ring-1 ring-white/10">
      <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
        Ranked leaderboard
      </h2>
      <ol className="space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.rank}
            className={[
              "flex items-center justify-between rounded-lg px-3 py-1.5 ring-1",
              r.rank === 1 ? "bg-amber-500/15 ring-amber-400/50" : "bg-slate-800/60 ring-white/10",
            ].join(" ")}
          >
            <span className="flex items-center gap-2 text-sm text-white">
              <span className={r.rank === 1 ? "text-amber-300" : "text-slate-500"}>#{r.rank}</span>
              {r.username}
            </span>
            <span className="flex items-center gap-2 font-mono text-sm">
              <span className="font-semibold text-emerald-300">{r.rating}</span>
              <span className="text-xs text-slate-500">{r.gamesPlayed} games</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
