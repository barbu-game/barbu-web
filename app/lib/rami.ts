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
  // A three-card set's joker has no definite suit: it is only taken from a four of a kind.
  if (at < 0 || card.joker || (meld.kind === "SET" && meld.cards.length < 4)) return false;
  const swapped = meld.cards.map((c, i) => (i === at ? card : c));
  return meldKind(swapped) === meld.kind;
}

/**
 * Legal moves for tapping `meld` with the selected `cards`; several when the cards fit either end
 * of a run.
 */
export function meldTapMoves(meld: RamiMeldT, cards: RamiCardT[], handSize: number): RamiMove[] {
  const moves: RamiMove[] = [];
  if (cards.length === 1 && canSwapJoker(meld, cards[0])) moves.push({ kind: "swapJoker", meldId: meld.id, cardId: cards[0].id });
  if (cards.length >= handSize) return moves;
  const ids = cards.map((c) => c.id);
  const after = meldKind([...meld.cards, ...cards]) === meld.kind;
  const before = meldKind([...cards, ...meld.cards]) === meld.kind;
  if (after) moves.push({ kind: "layoff", meldId: meld.id, before: [], after: ids });
  // A set has no order, so both ends are the same move.
  if (before && !(after && meld.kind === "SET")) moves.push({ kind: "layoff", meldId: meld.id, before: ids, after: [] });
  return moves;
}

/** The manual hand order with `id` moved to `toIndex` (clamped); unknown ids leave it unchanged. */
export function moveCard(order: number[], id: number, toIndex: number): number[] {
  if (!order.includes(id)) return [...order];
  const rest = order.filter((x) => x !== id);
  const at = Math.max(0, Math.min(toIndex, rest.length));
  return [...rest.slice(0, at), id, ...rest.slice(at)];
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

// Mirrors the felt's CSS: pile caption, owner label, meld padding and gaps, in px.
const PILE_SCALE = 1.2;
const CAPTION_H = 20;
const LABEL_H = 17;
const MELD_PAD = 8;
const GAP = 8;
const SECTION_GAP = 12;
const AREA_PAD = 22;
export const MELD_STEP = 0.55;

/** Largest table-card width (min..max) at which the piles and every owner's melds fit `area` unscrolled. */
export function fitMeldWidth(area: { width: number; height: number }, owners: number[][], min = 22, max = 60): number {
  const w = area.width - AREA_PAD;
  const h = area.height - AREA_PAD;
  for (let cw = max; cw > min; cw -= 2) {
    const cardH = cw * 1.4;
    const meldH = cardH + MELD_PAD;
    let total = cw * PILE_SCALE * 1.4 + CAPTION_H;
    if (cw * PILE_SCALE * 2 + 16 > w) continue;
    let fits = true;
    for (const counts of owners) {
      let rows = 1;
      let line = 0;
      for (const n of counts) {
        const mw = cw + (n - 1) * cw * MELD_STEP + MELD_PAD;
        if (mw > w) fits = false;
        if (line > 0 && line + GAP + mw > w) {
          rows++;
          line = mw;
        } else line += (line > 0 ? GAP : 0) + mw;
      }
      total += GAP + LABEL_H + GAP + rows * meldH + (rows - 1) * GAP;
    }
    if (owners.length) total += SECTION_GAP - GAP;
    if (fits && total <= h) return cw;
  }
  return min;
}
