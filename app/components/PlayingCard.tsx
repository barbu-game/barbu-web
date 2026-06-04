"use client";

import { isRedSuit, rankLabel, SUIT_SYMBOL, type CardT } from "../lib/game";

type Props = {
  card: CardT;
  size?: "sm" | "md" | "lg";
  playable?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
};

const SIZES = {
  sm: "h-14 w-10 text-sm",
  md: "h-20 w-14 text-lg",
  lg: "h-28 w-20 text-2xl",
};

export default function PlayingCard({ card, size = "md", playable, dimmed, onClick }: Props) {
  const red = isRedSuit(card.suit);
  return (
    <button
      type="button"
      disabled={!playable || !onClick}
      onClick={onClick}
      className={[
        "relative flex select-none flex-col items-center justify-between rounded-lg border bg-white p-1 font-semibold shadow-md transition-all",
        SIZES[size],
        red ? "text-rose-600" : "text-slate-900",
        playable
          ? "cursor-pointer border-emerald-400 ring-2 ring-emerald-400/60 hover:-translate-y-2"
          : "border-slate-300",
        dimmed ? "opacity-50" : "",
      ].join(" ")}
    >
      <span className="self-start leading-none">{rankLabel(card.rank)}</span>
      <span className="text-[1.6em] leading-none">{SUIT_SYMBOL[card.suit]}</span>
      <span className="self-end rotate-180 leading-none">{rankLabel(card.rank)}</span>
    </button>
  );
}
