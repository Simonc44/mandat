import { describe, it, expect, vi, beforeEach } from "vitest";
import { reportLovableError } from "./lovable-error-reporting";

describe("reportLovableError()", () => {
  beforeEach(() => {
    vi.stubGlobal("window", undefined);
  });

  it("ne fait rien si window est undefined", () => {
    const error = new Error("test");
    // On vérifie que ça ne crash pas
    expect(() => reportLovableError(error)).not.toThrow();
  });

  it("appelle captureException si window est défini", () => {
    const captureException = vi.fn();
    vi.stubGlobal("window", {
      location: { pathname: "/test" },
      __lovableEvents: { captureException },
    });

    const error = new Error("test");
    reportLovableError(error, { extra: "info" });

    expect(captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        source: "react_error_boundary",
        route: "/test",
        extra: "info",
      }),
      expect.anything(),
    );
  });
});
