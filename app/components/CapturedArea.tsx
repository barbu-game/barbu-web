"use client";

import { isRedSuit, rankLabel, SUIT_SYMBOL, type CardT } from "../lib/game";
import { resolveCapture } from "../lib/captured";
import { cn } from "../lib/cn";

type Size = "sm" | "xs";

const FACE: Record<Size, string> = {
  sm: "h-8 w-[22px] text-[10px]",
  xs: "h-6 w-[17px] text-[8px]",
};
const SLIVER: Record<Size, string> = {
  sm: "h-8 w-4 text-[10px]",
  xs: "h-6 w-3 text-[8px]",
};
const OVERLAP: Record<Size, string> = { sm: "-ml-2.5", xs: "-ml-2" };

function MiniFace({ card, size, className }: { card: CardT; size: Size; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 flex-col items-center rounded-[3px] bg-paper pt-[2px] font-semibold leading-none shadow-sm ring-1 ring-black/15",
        FACE[size],
        isRedSuit(card.suit) ? "text-ink-red" : "text-ink",
        className,
      )}
    >
      <span>{rankLabel(card.rank)}</span>
      <span>{SUIT_SYMBOL[card.suit]}</span>
    </span>
  );
}

// A real pile: the top card sits face-up (rank + suit) and the ones underneath only
// peek out as colored slivers, so the colors show without making the count easy to read.
function CapturedPile({ cards, size }: { cards: CardT[]; size: Size }) {
  return (
    <span className="flex">
      {cards.map((card, i) =>
        i === cards.length - 1 ? (
          <MiniFace key={`${card.suit}-${card.rank}-${i}`} card={card} size={size} className={i > 0 ? OVERLAP[size] : undefined} />
        ) : (
          <span
            key={`${card.suit}-${card.rank}-${i}`}
            className={cn(
              "flex shrink-0 justify-center rounded-[3px] bg-paper pt-[2px] leading-none shadow-sm ring-1 ring-black/15",
              SLIVER[size],
              i > 0 && OVERLAP[size],
              isRedSuit(card.suit) ? "text-ink-red" : "text-ink",
            )}
          >
            {SUIT_SYMBOL[card.suit]}
          </span>
        ),
      )}
    </span>
  );
}

export default function CapturedArea({
  cards,
  contract,
  playerCount,
  size = "sm",
  tight,
  className,
}: {
  cards: CardT[];
  contract?: string;
  playerCount: number;
  size?: Size;
  /** Single row with piles overlapping each other, for fixed-height slots. */
  tight?: boolean;
  className?: string;
}) {
  const view = resolveCapture(contract, cards, playerCount);
  if (!view) return null;

  return (
    <div className={cn("flex", tight ? "[&>*+*]:-ml-3" : "flex-wrap gap-1", className)}>
      {view.kind === "separated" &&
        view.cards.map((card) => <MiniFace key={`${card.suit}-${card.rank}`} card={card} size={size} />)}
      {view.kind === "stacked" && <CapturedPile cards={view.cards} size={size} />}
      {view.kind === "tricks" && view.piles.map((pile, i) => <CapturedPile key={i} cards={pile} size={size} />)}
    </div>
  );
}
