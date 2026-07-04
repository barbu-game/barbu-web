import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CardT } from "../lib/game";
import CapturedArea from "./CapturedArea";

const c = (suit: string, rank: string): CardT => ({ suit, rank });

describe("CapturedArea", () => {
  it("renders nothing for montante / no captured cards", () => {
    const html = renderToStaticMarkup(<CapturedArea cards={[]} contract="MONTANTE" playerCount={3} />);
    expect(html).toBe("");
  });

  it("renders a captured trick under NO_TRICKS with the top card face-up", () => {
    const trick = [c("SPADES", "TWO"), c("HEARTS", "THREE"), c("CLUBS", "FOUR")];
    const html = renderToStaticMarkup(<CapturedArea cards={trick} contract="NO_TRICKS" playerCount={3} />);
    expect(html).not.toBe("");
    expect(html).toContain("♥"); // a sliver color peeks out
    expect(html).toContain("4"); // the top card (CLUBS FOUR) shows its rank
  });

  it("renders the captured queen under NO_QUEENS", () => {
    const html = renderToStaticMarkup(
      <CapturedArea cards={[c("CLUBS", "TWO"), c("HEARTS", "QUEEN")]} contract="NO_QUEENS" playerCount={3} />,
    );
    expect(html).toContain("Q");
  });
});
