import type { RamiView, RamiViewMeldView, RamiViewRamiCardView } from "@barbu-game/barbu-api";

// Client-side mirror of the server's meld rules: it only drives hints (opening counter, which end a
// lay-off goes to, enabled buttons). The server stays authoritative and rejects anything illegal.

export type RamiCardT = RamiViewRamiCardView;
export type RamiMeldT = RamiViewMeldView;
export type RamiViewT = RamiView;
export type MeldKind = "RUN" | "SET";

/** Moves the client sends inside `{ type: "play", move }`; inbound shapes are not in the OpenAPI. */
export type RamiMove =
  | { kind: "draw"; source: "STOCK" | "DISCARD" }
  | { kind: "open"; melds: number[][] }
  | { kind: "meld"; cards: number[] }
  | { kind: "layoff"; meldId: number; before: number[]; after: number[] }
  | { kind: "swapJoker"; meldId: number; cardId: number }
  | { kind: "reset" }
  | { kind: "discard"; cardId: number };

export const OPENING_MIN = 51;

const RANK_VALUE: Record<string, number> = {
  TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8,
  NINE: 9, TEN: 10, JACK: 11, QUEEN: 12, KING: 13, ACE: 14,
};
const LOW_ACE = 1;
const HIGH_ACE = 14;
// An ace may open or close a run, never both.
const MAX_RUN = 13;

const reals = (cards: RamiCardT[]) => cards.filter((c) => !c.joker);

function jokerBudgetOk(cards: RamiCardT[]): boolean {
  return cards.length >= 3 && cards.filter((c) => c.joker).length <= 1;
}

function isSet(cards: RamiCardT[]): boolean {
  if (!jokerBudgetOk(cards) || cards.length > 4) return false;
  const r = reals(cards);
  return r.every((c) => c.rank === r[0].rank) && new Set(r.map((c) => c.suit)).size === r.length;
}

function matches(rank: string, position: number): boolean {
  return rank === "ACE" ? position === LOW_ACE || position === HIGH_ACE : RANK_VALUE[rank] === position;
}

/** Position (1 = low ace … 14 = high ace) of the first card when the cards form a run in this order. */
function runStart(cards: RamiCardT[]): number | null {
  if (!jokerBudgetOk(cards) || cards.length > MAX_RUN) return null;
  const r = reals(cards);
  if (r.some((c) => c.suit !== r[0].suit)) return null;
  const i = cards[0].joker ? 1 : 0;
  const first = cards[i].rank!;
  const candidates = first === "ACE" ? [LOW_ACE - i, HIGH_ACE - i] : [RANK_VALUE[first] - i];
  for (const start of candidates) {
    if (start < LOW_ACE || start + cards.length - 1 > HIGH_ACE) continue;
    if (cards.every((c, k) => c.joker || matches(c.rank!, start + k))) return start;
  }
  return null;
}

export function meldKind(cards: RamiCardT[]): MeldKind | null {
  if (isSet(cards)) return "SET";
  return runStart(cards) !== null ? "RUN" : null;
}

const rankPoints = (rank: string) => (rank === "ACE" ? 11 : Math.min(RANK_VALUE[rank], 10));
const positionPoints = (p: number) => (p === LOW_ACE ? 1 : p === HIGH_ACE ? 11 : Math.min(p, 10));

/** Opening value of a valid meld (0 otherwise); a joker is worth the card it stands for. */
export function meldPoints(cards: RamiCardT[]): number {
  if (isSet(cards)) return cards.length * rankPoints(reals(cards)[0].rank!);
  const start = runStart(cards);
  if (start === null) return 0;
  return cards.reduce((sum, _, k) => sum + positionPoints(start + k), 0);
}

export const openingTotal = (groups: RamiCardT[][]) => groups.reduce((sum, g) => sum + meldPoints(g), 0);

/** The lay-off move putting `cards` at the end of `meld` that keeps it valid, or null. */
export function layOffMove(meld: RamiMeldT, cards: RamiCardT[]): RamiMove | null {
  const ids = cards.map((c) => c.id);
  if (meldKind([...meld.cards, ...cards]) === meld.kind) return { kind: "layoff", meldId: meld.id, before: [], after: ids };
  if (meldKind([...cards, ...meld.cards]) === meld.kind) return { kind: "layoff", meldId: meld.id, before: ids, after: [] };
  return null;
}

export function canSwapJoker(meld: RamiMeldT, card: RamiCardT): boolean {
  const at = meld.cards.findIndex((c) => c.joker);
  if (at < 0 || card.joker) return false;
  const swapped = meld.cards.map((c, i) => (i === at ? card : c));
  return meldKind(swapped) === meld.kind;
}

/** Legal moves for tapping `meld` with the selected `cards`; two when a set's joker could also take the card. */
export function meldTapMoves(meld: RamiMeldT, cards: RamiCardT[], handSize: number): RamiMove[] {
  const moves: RamiMove[] = [];
  if (cards.length === 1 && canSwapJoker(meld, cards[0])) moves.push({ kind: "swapJoker", meldId: meld.id, cardId: cards[0].id });
  const layOff = layOffMove(meld, cards);
  if (layOff && cards.length < handSize) moves.push(layOff);
  return moves;
}

const SUIT_ORDER = ["SPADES", "HEARTS", "CLUBS", "DIAMONDS"];

export function sortRamiHand(hand: RamiCardT[], by: "suit" | "rank"): RamiCardT[] {
  const suit = (c: RamiCardT) => (c.joker ? 99 : SUIT_ORDER.indexOf(c.suit!));
  const rank = (c: RamiCardT) => (c.joker ? 99 : RANK_VALUE[c.rank!]);
  return [...hand].sort((a, b) =>
    by === "suit" ? suit(a) - suit(b) || rank(a) - rank(b) || a.id - b.id : rank(a) - rank(b) || suit(a) - suit(b) || a.id - b.id,
  );
}

/** Penalty a card costs when left in hand at round end. */
export const penalty = (c: RamiCardT) => (c.joker ? 25 : rankPoints(c.rank!));
