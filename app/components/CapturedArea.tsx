"use client";

import { isRedSuit, rankLabel, SUIT_SYMBOL, type CardT } from "../lib/game";
import { resolveCapture } from "../lib/captured";
import Card from "../ui/Card";

// Top card face-up; the rest peek out as colored slivers so suit colors show without making the
// count easy to read.
function CapturedPile({ cards }: { cards: CardT[] }) {
  return (
    <div className="flex">
      {cards.map((card, i) => {
        const isTop = i === cards.length - 1;
        return (
          <span
            key={`${card.suit}-${card.rank}-${i}`}
            className={[
              "flex h-9 flex-col rounded-[3px] border border-border bg-white pt-0.5 font-bold leading-none shadow-sm",
              isTop ? "w-6 items-start px-1 text-[10px]" : "w-5 items-center justify-center text-[11px]",
              isRedSuit(card.suit) ? "text-danger" : "text-[#0f172a]",
              i > 0 ? "-ml-3" : "",
            ].join(" ")}
          >
            {isTop ? (
              <>
                <span>{rankLabel(card.rank)}</span>
                <span className="text-[1.3em]">{SUIT_SYMBOL[card.suit]}</span>
              </>
            ) : (
              SUIT_SYMBOL[card.suit]
            )}
          </span>
        );
      })}
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
          <Card key={`${card.suit}-${card.rank}`} card={card} size="sm" />
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
