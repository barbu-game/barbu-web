"use client";

import { isRedSuit, rankLabel, SUIT_SYMBOL, type CardT } from "../lib/game";
import { cn } from "../lib/cn";

type Props = {
  card: CardT;
  size?: "sm" | "md" | "lg";
  playable?: boolean;
  dimmed?: boolean;
  highlight?: boolean;
  onClick?: () => void;
};

const SIZES = {
  sm: "h-[70px] w-[50px] text-[13px] rounded-md p-1",
  md: "h-[100px] w-[72px] text-lg rounded-lg p-1.5",
  lg: "h-[114px] w-[82px] text-xl rounded-[11px] p-2",
};

export default function Card({ card, size = "md", playable, dimmed, highlight, onClick }: Props) {
  const red = isRedSuit(card.suit);
  return (
    <button
      type="button"
      data-testid="card"
      data-card={`${card.suit}-${card.rank}`}
      data-playable={playable ? "true" : "false"}
      disabled={!playable || !onClick}
      onClick={onClick}
      className={cn(
        "relative flex select-none flex-col justify-between bg-gradient-to-b from-white to-[#f2f4f8] font-display font-bold shadow-[0_12px_24px_rgba(0,0,0,0.4)] ring-1 ring-black/5 transition-all duration-200",
        SIZES[size],
        red ? "text-danger" : "text-[#0f172a]",
        highlight && "-translate-y-2.5 ring-2 ring-gold-soft shadow-[0_18px_30px_rgba(0,0,0,0.5)]",
        playable && "cursor-pointer hover:-translate-y-4 hover:shadow-[0_20px_34px_rgba(0,0,0,0.5)]",
        dimmed && "opacity-40 saturate-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft",
      )}
    >
      <span className="self-start leading-none">{rankLabel(card.rank)}</span>
      <span className="absolute inset-0 grid place-items-center text-[2.1em] leading-none opacity-90">
        {SUIT_SYMBOL[card.suit]}
      </span>
      <span className="self-end rotate-180 leading-none">{rankLabel(card.rank)}</span>
    </button>
  );
}
