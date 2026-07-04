import { describe, expect, it } from "vitest";
import type { CardT } from "./game";
import { chunkIntoTricks, isRedKing, resolveCapture } from "./captured";

const c = (suit: string, rank: string): CardT => ({ suit, rank });

describe("chunkIntoTricks", () => {
  it("splits a flat list into piles of playerCount", () => {
    const cards = [c("SPADES", "TWO"), c("HEARTS", "THREE"), c("CLUBS", "FOUR"), c("DIAMONDS", "FIVE")];
    expect(chunkIntoTricks(cards, 2)).toEqual([
      [cards[0], cards[1]],
      [cards[2], cards[3]],
    ]);
  });

  it("returns [] for empty input", () => {
    expect(chunkIntoTricks([], 3)).toEqual([]);
  });
});

describe("isRedKing", () => {
  it("matches hearts/diamonds kings only", () => {
    expect(isRedKing(c("HEARTS", "KING"))).toBe(true);
    expect(isRedKing(c("DIAMONDS", "KING"))).toBe(true);
    expect(isRedKing(c("SPADES", "KING"))).toBe(false);
    expect(isRedKing(c("HEARTS", "QUEEN"))).toBe(false);
  });
});

describe("resolveCapture", () => {
  const trick = [c("SPADES", "TWO"), c("HEARTS", "THREE"), c("CLUBS", "FOUR")];

  it("returns null when nothing captured (e.g. montante)", () => {
    expect(resolveCapture("MONTANTE", [], 3)).toBeNull();
    expect(resolveCapture(undefined, [], 3)).toBeNull();
  });

  it("NO_TRICKS groups all cards into trick piles", () => {
    expect(resolveCapture("NO_TRICKS", trick, 3)).toEqual({ kind: "tricks", piles: [trick] });
  });

  it("NO_HEARTS keeps only hearts, stacked", () => {
    const cards = [c("SPADES", "TWO"), c("HEARTS", "THREE"), c("HEARTS", "ACE")];
    expect(resolveCapture("NO_HEARTS", cards, 3)).toEqual({
      kind: "stacked",
      cards: [c("HEARTS", "THREE"), c("HEARTS", "ACE")],
    });
  });

  it("NO_QUEENS keeps only queens, separated", () => {
    const cards = [c("SPADES", "QUEEN"), c("CLUBS", "TWO"), c("HEARTS", "QUEEN")];
    expect(resolveCapture("NO_QUEENS", cards, 3)).toEqual({
      kind: "separated",
      cards: [c("SPADES", "QUEEN"), c("HEARTS", "QUEEN")],
    });
  });

  it("NO_RED_KINGS keeps only red kings, separated", () => {
    const cards = [c("HEARTS", "KING"), c("SPADES", "KING"), c("DIAMONDS", "KING")];
    expect(resolveCapture("NO_RED_KINGS", cards, 3)).toEqual({
      kind: "separated",
      cards: [c("HEARTS", "KING"), c("DIAMONDS", "KING")],
    });
  });

  it("returns null when the filter matches nothing", () => {
    expect(resolveCapture("NO_QUEENS", [c("SPADES", "TWO")], 3)).toBeNull();
  });

  it("defaults an unknown trick contract to trick piles", () => {
    expect(resolveCapture("SOMETHING_NEW", trick, 3)).toEqual({ kind: "tricks", piles: [trick] });
  });
});
