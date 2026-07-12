import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy classes and drops falsy ones", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
  it("lets later tailwind classes win over earlier conflicting ones", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
