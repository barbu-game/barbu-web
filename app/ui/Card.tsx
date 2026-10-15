"use client";

import { isRedSuit, rankLabel, SUIT_SYMBOL } from "../lib/game";
import { cn } from "../lib/cn";

type Props = {
  /** A Barbu card, or a Rami card where a joker has no suit or rank. */
  card: { suit?: string | null; rank?: string | null; joker?: boolean };
  /** Card width in px; height and type follow the 5:7 ratio. */
  width?: number;
  playable?: boolean;
  dimmed?: boolean;
  highlight?: boolean;
  /** Raise a legal card at rest so it reads as playable on touch screens, where hover doesn't exist. */
  raised?: boolean;
  onClick?: () => void;
  className?: string;
};

export const CARD_RATIO = 1.4;

export default function Card({ card, width = 72, playable, dimmed, highlight, raised, onClick, className }: Props) {
  const joker = Boolean(card.joker);
  const red = !joker && isRedSuit(card.suit ?? "");
  const suit = joker ? "★" : SUIT_SYMBOL[card.suit ?? ""];
  const interactive = Boolean(playable && onClick);
  return (
    <button
      type="button"
      data-testid="card"
      data-card={joker ? "JOKER" : `${card.suit}-${card.rank}`}
      data-playable={playable ? "true" : "false"}
      disabled={!interactive}
      onClick={onClick}
      style={{ width, height: Math.round(width * CARD_RATIO), fontSize: Math.max(10, width * 0.24) }}
      className={cn(
        "relative block shrink-0 select-none rounded-[0.32em] bg-paper text-left font-semibold leading-none",
        "shadow-[0_1px_2px_rgba(0,0,0,0.35),0_6px_14px_rgba(0,0,0,0.25)] ring-1 ring-black/10",
        "transition-[transform,opacity,box-shadow] duration-150 ease-out motion-reduce:transition-none disabled:cursor-default",
        joker ? "text-gold" : red ? "text-ink-red" : "text-ink",
        raised && "-translate-y-[10%]",
        highlight && "ring-2 ring-gold-soft",
        interactive && "cursor-pointer hover:-translate-y-[18%] hover:shadow-[0_10px_24px_rgba(0,0,0,0.45)]",
        dimmed && "brightness-[0.55]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft",
        className,
      )}
    >
      <span className="absolute left-[0.28em] top-[0.3em] flex flex-col items-center gap-[0.08em]">
        <span className="tracking-tight">{joker ? "JK" : rankLabel(card.rank ?? "")}</span>
        <span className="text-[0.8em]">{suit}</span>
      </span>
      <span aria-hidden className="absolute bottom-[0.22em] right-[0.3em] text-[1.9em] leading-none">
        {suit}
      </span>
    </button>
  );
}
