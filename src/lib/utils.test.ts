import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn()", () => {
  it("fusionne les classes Tailwind", () => {
    expect(cn("px-2 py-2", "px-4")).toBe("py-2 px-4");
  });

  it("gère les conditions", () => {
    expect(cn("base", true && "active", false && "hidden")).toBe("base active");
  });
});
