import { describe, expect, it } from "vitest";
import { contrastRatio } from "../../scripts/check-contrast";

describe("contrastRatio", () => {
  it("matches the published reference value for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
  });

  it("matches the published reference value for #777 on white", () => {
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 1);
  });

  it("is symmetric: the order of the two colours does not matter", () => {
    const a = contrastRatio("#0D1A33", "#FFFFFF");
    const b = contrastRatio("#FFFFFF", "#0D1A33");
    expect(a).toBeCloseTo(b, 6);
  });
});
