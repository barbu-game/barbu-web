"use client";

import { isRedSuit, SUIT_SYMBOL, type CardT } from "../lib/game";
import { resolveCapture } from "../lib/captured";
import PlayingCard from "./PlayingCard";

// A tightly overlapped pile: each card shows only its suit symbol (color), so the
// pile reveals which colors are inside without making the exact count easy to read.
function CapturedPile({ cards }: { cards: CardT[] }) {
  return (
    <div className="flex">
      {cards.map((card, i) => (
        <span
          key={`${card.suit}-${card.rank}-${i}`}
          className={[
            "flex h-9 w-5 items-start justify-center rounded-[3px] border border-slate-300 bg-white pt-0.5 text-[11px] font-bold leading-none shadow-sm",
            isRedSuit(card.suit) ? "text-rose-600" : "text-slate-900",
            i > 0 ? "-ml-3" : "",
          ].join(" ")}
        >
          {SUIT_SYMBOL[card.suit]}
        </span>
      ))}
    </div>
  );
}

export default function CapturedArea({
  cards,
  contract,
  playerCount,
}: {
  cards: CardT[];
  contract?: string;
  playerCount: number;
}) {
  const view = resolveCapture(contract, cards, playerCount);
  if (!view) return null;

  if (view.kind === "separated") {
    return (
      <div className="mt-2 flex flex-wrap gap-1">
        {view.cards.map((card) => (
          <PlayingCard key={`${card.suit}-${card.rank}`} card={card} size="sm" />
        ))}
      </div>
    );
  }

  if (view.kind === "stacked") {
    return (
      <div className="mt-2 flex">
        <CapturedPile cards={view.cards} />
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {view.piles.map((pile, i) => (
        <CapturedPile key={i} cards={pile} />
      ))}
    </div>
  );
}
