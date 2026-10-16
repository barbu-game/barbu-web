import { describe, expect, it } from "vitest";
import { canSwapJoker, layOffMove, meldKind, meldPoints, meldTapMoves, moveCard, openingTotal, sortRamiHand, type RamiCardT } from "./rami";

let nextId = 0;
const SUITS: Record<string, string> = { H: "HEARTS", D: "DIAMONDS", C: "CLUBS", S: "SPADES" };
const RANKS: Record<string, string> = {
  A: "ACE", "2": "TWO", "3": "THREE", "4": "FOUR", "5": "FIVE", "6": "SIX", "7": "SEVEN",
  "8": "EIGHT", "9": "NINE", "10": "TEN", J: "JACK", Q: "QUEEN", K: "KING",
};

/** "7H", "10D", "QS", "AC" or "JK" (joker). */
function c(code: string): RamiCardT {
  if (code === "JK") return { id: nextId++, joker: true };
  return { id: nextId++, suit: SUITS[code.slice(-1)], rank: RANKS[code.slice(0, -1)], joker: false };
}
const cs = (...codes: string[]) => codes.map(c);

describe("meldKind", () => {
  it("accepts runs and sets with at most one joker", () => {
    expect(meldKind(cs("5H", "6H", "7H"))).toBe("RUN");
    expect(meldKind(cs("5H", "JK", "7H"))).toBe("RUN");
    expect(meldKind(cs("AH", "2H", "3H"))).toBe("RUN");
    expect(meldKind(cs("QH", "KH", "AH"))).toBe("RUN");
    expect(meldKind(cs("7H", "7S", "7D"))).toBe("SET");
    expect(meldKind(cs("7H", "7S", "JK"))).toBe("SET");
  });

  it("rejects wraps, double aces, mixed suits, duplicates and two jokers", () => {
    expect(meldKind(cs("KH", "AH", "2H"))).toBeNull();
    expect(meldKind(cs("JK", "AH", "2H"))).toBeNull();
    expect(meldKind(cs("AH", "2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "10H", "JH", "QH", "KH", "AH"))).toBeNull();
    expect(meldKind(cs("5H", "6S", "7H"))).toBeNull();
    expect(meldKind(cs("7H", "7H", "7S"))).toBeNull();
    expect(meldKind(cs("5H", "JK", "JK"))).toBeNull();
    expect(meldKind(cs("5H", "6H"))).toBeNull();
  });
});

describe("meldPoints and openingTotal", () => {
  it("values a joker as the card it stands for", () => {
    expect(meldPoints(cs("5H", "6H", "JK"))).toBe(18);
    expect(meldPoints(cs("JH", "QH", "KH"))).toBe(30);
    expect(meldPoints(cs("AH", "2H", "3H"))).toBe(6);
    expect(meldPoints(cs("QH", "KH", "AH"))).toBe(31);
    expect(meldPoints(cs("AH", "AS", "AD"))).toBe(33);
  });

  it("sums only valid groups", () => {
    expect(openingTotal([cs("JH", "QH", "KH"), cs("7S", "7D", "7C")])).toBe(51);
    expect(openingTotal([cs("JH", "QH", "KH"), cs("7S", "8D", "7C")])).toBe(30);
  });
});

describe("layOffMove", () => {
  const meld = (cards: RamiCardT[], kind = "RUN") => ({ id: 4, owner: 1, kind, cards });

  it("appends after a run when the card follows it", () => {
    const eight = c("8H");
    expect(layOffMove(meld(cs("5H", "6H", "7H")), [eight])).toEqual({ kind: "layoff", meldId: 4, before: [], after: [eight.id] });
  });

  it("prepends when the card precedes it", () => {
    const four = c("4H");
    expect(layOffMove(meld(cs("5H", "6H", "7H")), [four])).toEqual({ kind: "layoff", meldId: 4, before: [four.id], after: [] });
  });

  it("returns null when the cards do not extend the meld", () => {
    expect(layOffMove(meld(cs("5H", "6H", "7H")), cs("9S"))).toBeNull();
    expect(layOffMove(meld(cs("7H", "7S", "7D"), "SET"), cs("7H"))).toBeNull();
  });

  it("extends a set with a missing suit", () => {
    const club = c("7C");
    expect(layOffMove(meld(cs("7H", "7S", "7D"), "SET"), [club])).toEqual({ kind: "layoff", meldId: 4, before: [], after: [club.id] });
  });
});

describe("canSwapJoker", () => {
  it("accepts only the card the joker stands for", () => {
    const run = { id: 2, owner: 0, kind: "RUN", cards: cs("5H", "6H", "JK") };
    expect(canSwapJoker(run, c("7H"))).toBe(true);
    expect(canSwapJoker(run, c("8H"))).toBe(false);
    const set = { id: 3, owner: 0, kind: "SET", cards: cs("7H", "7S", "JK") };
    expect(canSwapJoker(set, c("7D"))).toBe(true);
    expect(canSwapJoker(set, c("7H"))).toBe(false);
    expect(canSwapJoker({ id: 5, owner: 0, kind: "RUN", cards: cs("5H", "6H", "7H") }, c("8H"))).toBe(false);
  });
});

describe("sortRamiHand", () => {
  it("groups by suit or by rank, jokers last", () => {
    const hand = cs("KS", "JK", "2H", "2S", "AH");
    expect(sortRamiHand(hand, "suit").map((x) => x.joker ? "JK" : `${x.rank}-${x.suit}`)).toEqual([
      "TWO-SPADES", "KING-SPADES", "TWO-HEARTS", "ACE-HEARTS", "JK",
    ]);
    expect(sortRamiHand(hand, "rank").map((x) => x.joker ? "JK" : `${x.rank}-${x.suit}`)).toEqual([
      "TWO-SPADES", "TWO-HEARTS", "KING-SPADES", "ACE-HEARTS", "JK",
    ]);
  });
});

describe("meldTapMoves", () => {
  it("offers both the swap and the lay-off when a set's joker could also take a fourth card", () => {
    const set = { id: 3, owner: 0, kind: "SET", cards: cs("7H", "7S", "JK") };
    const diamond = c("7D");
    expect(meldTapMoves(set, [diamond], 5)).toEqual([
      { kind: "swapJoker", meldId: 3, cardId: diamond.id },
      { kind: "layoff", meldId: 3, before: [], after: [diamond.id] },
    ]);
  });

  it("offers only the lay-off for a run, and nothing that would empty the hand", () => {
    const run = { id: 4, owner: 1, kind: "RUN", cards: cs("5H", "6H", "7H") };
    const eight = c("8H");
    expect(meldTapMoves(run, [eight], 3)).toEqual([{ kind: "layoff", meldId: 4, before: [], after: [eight.id] }]);
    expect(meldTapMoves(run, [eight], 1)).toEqual([]);
    expect(meldTapMoves(run, cs("9S"), 3)).toEqual([]);
  });
});

describe("meldTapMoves at both ends", () => {
  it("offers the start and the end when a joker fits either side of a run", () => {
    const run = { id: 6, owner: 0, kind: "RUN", cards: cs("5H", "6H", "7H") };
    const joker = c("JK");
    expect(meldTapMoves(run, [joker], 4)).toEqual([
      { kind: "layoff", meldId: 6, before: [], after: [joker.id] },
      { kind: "layoff", meldId: 6, before: [joker.id], after: [] },
    ]);
  });
});

describe("moveCard", () => {
  it("moves a card to a new position in the manual order", () => {
    expect(moveCard([1, 2, 3, 4], 1, 2)).toEqual([2, 3, 1, 4]);
    expect(moveCard([1, 2, 3, 4], 4, 0)).toEqual([4, 1, 2, 3]);
    expect(moveCard([1, 2, 3], 2, 9)).toEqual([1, 3, 2]);
    expect(moveCard([1, 2, 3], 7, 0)).toEqual([1, 2, 3]);
  });
});
