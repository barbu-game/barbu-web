import { describe, expect, it } from "vitest";
import { fr } from "./fr";
import { en } from "./en";

describe("i18n dictionaries", () => {
  it("EN has exactly the same keys as FR", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  });
  it("no dictionary value is empty", () => {
    for (const v of [...Object.values(fr), ...Object.values(en)]) {
      expect(v.trim().length).toBeGreaterThan(0);
    }
  });
});
