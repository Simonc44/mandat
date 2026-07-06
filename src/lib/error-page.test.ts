import { describe, it, expect } from "vitest";
import { renderErrorPage } from "./error-page";

describe("renderErrorPage()", () => {
  it("retourne une chaîne HTML contenant le message d erreur", () => {
    const html = renderErrorPage();
    expect(html).toContain("This page didn't load");
    expect(html).toContain("<!doctype html>");
  });
});
