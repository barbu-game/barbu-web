"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import type { RatingServiceLeaderboardRow } from "@barbu-game/barbu-api";
import { useT } from "../lib/i18n";
import { cn } from "../lib/cn";
import Dialog from "../ui/Dialog";
import IconButton from "../ui/IconButton";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function LeaderboardButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RatingServiceLeaderboardRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [game, setGame] = useState<"BARBU" | "RAMI">("BARBU");

  useEffect(() => {
    if (!open) return;
    // A slower answer for the previous tab must not overwrite the current one.
    let live = true;
    fetch(`${API}/leaderboard?limit=20&game=${game}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: RatingServiceLeaderboardRow[]) => {
        if (!live) return;
        setRows(data);
        setFailed(false);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [open, game]);

  return (
    <>
      <IconButton label={t("leaderboard.title")} onClick={() => setOpen(true)}>
        <Trophy size={18} />
      </IconButton>
      <Dialog open={open} onOpenChange={setOpen} title={t("leaderboard.title")}>
        <div className="p-3">
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-2 p-1" role="tablist">
            {(["BARBU", "RAMI"] as const).map((g) => (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={game === g}
                data-testid={`leaderboard-${g.toLowerCase()}`}
                onClick={() => {
                  setRows(null);
                  setGame(g);
                }}
                className={cn(
                  "h-8 rounded-md text-sm font-medium transition-colors",
                  game === g ? "bg-surface text-foreground shadow-sm" : "text-muted-fg hover:text-foreground",
                )}
              >
                {t(g === "BARBU" ? "game.barbu" : "game.rami")}
              </button>
            ))}
          </div>
          {failed ? (
            <p className="p-4 text-center text-sm text-muted-fg">{t("leaderboard.unavailable")}</p>
          ) : rows === null ? (
            <p className="p-4 text-center text-sm text-muted-fg">…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-fg">{t("leaderboard.empty")}</p>
          ) : (
            <ol>
              {rows.map((r) => (
                <li key={r.rank} className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm odd:bg-white/[0.02]">
                  <span className={cn("w-6 tabular-nums", r.rank <= 3 ? "text-gold-soft" : "text-muted-fg")}>{r.rank}</span>
                  <span className="min-w-0 flex-1 truncate">{r.username}</span>
                  <span className="text-xs text-muted-fg">{t("leaderboard.games", { n: r.gamesPlayed })}</span>
                  <span className="w-12 text-right font-semibold tabular-nums">{r.rating}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Dialog>
    </>
  );
}
