import type { CardT } from "./game";

export type CaptureMode =
  | { unit: "trick" }
  | { unit: "card"; filter: (card: CardT) => boolean; display: "stacked" | "separated" };

export const isHeart = (card: CardT) => card.suit === "HEARTS";
export const isQueen = (card: CardT) => card.rank === "QUEEN";
export const isRedKing = (card: CardT) =>
  card.rank === "KING" && (card.suit === "HEARTS" || card.suit === "DIAMONDS");
export const isKingOfHearts = (card: CardT) => card.rank === "KING" && card.suit === "HEARTS";
export const isJack = (card: CardT) => card.rank === "JACK";

const TRICK_MODE: CaptureMode = { unit: "trick" };

export const CONTRACT_CAPTURE: Record<string, CaptureMode> = {
  NO_TRICKS: TRICK_MODE,
  NO_LAST_TWO_TRICKS: TRICK_MODE,
  SALADE: TRICK_MODE,
  NO_HEARTS: { unit: "card", filter: isHeart, display: "stacked" },
  NO_QUEENS: { unit: "card", filter: isQueen, display: "separated" },
  NO_RED_KINGS: { unit: "card", filter: isRedKing, display: "separated" },
  NO_KING_OF_HEARTS: { unit: "card", filter: isKingOfHearts, display: "separated" },
  NO_JACKS: { unit: "card", filter: isJack, display: "separated" },
};

export function chunkIntoTricks(cards: CardT[], playerCount: number): CardT[][] {
  if (playerCount <= 0) return [];
  const piles: CardT[][] = [];
  for (let i = 0; i < cards.length; i += playerCount) {
    piles.push(cards.slice(i, i + playerCount));
  }
  return piles;
}

export type CaptureView =
  | { kind: "tricks"; piles: CardT[][] }
  | { kind: "stacked"; cards: CardT[] }
  | { kind: "separated"; cards: CardT[] }
  | null;

export function resolveCapture(
  contract: string | undefined,
  cards: CardT[],
  playerCount: number,
): CaptureView {
  if (cards.length === 0) return null;
  // captured is only ever sent for trick-taking rounds, so an unknown contract is one of those.
  const mode = (contract ? CONTRACT_CAPTURE[contract] : undefined) ?? TRICK_MODE;
  if (mode.unit === "trick") {
    const piles = chunkIntoTricks(cards, playerCount);
    return piles.length === 0 ? null : { kind: "tricks", piles };
  }
  const filtered = cards.filter(mode.filter);
  if (filtered.length === 0) return null;
  return mode.display === "stacked"
    ? { kind: "stacked", cards: filtered }
    : { kind: "separated", cards: filtered };
}
