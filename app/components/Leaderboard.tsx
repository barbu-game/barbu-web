"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import type { RatingServiceLeaderboardRow } from "@barbu-game/barbu-api";
import { useT } from "../lib/i18n";
import { cn } from "../lib/cn";
import Dialog from "../ui/Dialog";
import IconButton from "../ui/IconButton";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function LeaderboardButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RatingServiceLeaderboardRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch(`${API}/leaderboard?limit=20`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: RatingServiceLeaderboardRow[]) => {
        setRows(data);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [open]);

  return (
    <>
      <IconButton label={t("leaderboard.title")} onClick={() => setOpen(true)}>
        <Trophy size={18} />
      </IconButton>
      <Dialog open={open} onOpenChange={setOpen} title={t("leaderboard.title")}>
        <div className="p-3">
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
