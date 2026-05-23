import { describe, expect, it } from "vitest";
import {
  toUSD,
  formatMarketCap,
  formatPercent,
  formatLargeNumber,
} from "../formatters";

describe("toUSD", () => {
  it("formats whole numbers with currency", () => {
    expect(toUSD(1500)).toBe("$1,500.00");
  });

  it("formats decimals", () => {
    expect(toUSD(1234.567)).toBe("$1,234.57");
  });

  it("handles zero", () => {
    expect(toUSD(0)).toBe("$0.00");
  });

  it("handles negatives", () => {
    expect(toUSD(-50)).toBe("-$50.00");
  });
});

describe("formatMarketCap", () => {
  it.each([
    [1_500_000_000_000, "$1.50T"],
    [2_300_000_000, "$2.30B"],
    [45_000_000, "$45.00M"],
  ])("formats %i as %s", (input, output) => {
    expect(formatMarketCap(input)).toBe(output);
  });

  it("falls back to USD for small values", () => {
    expect(formatMarketCap(999)).toBe("$999.00");
  });

  it("returns N/A for null", () => {
    expect(formatMarketCap(null)).toBe("N/A");
  });
});

describe("formatPercent", () => {
  it("converts ratio to one-decimal percent", () => {
    expect(formatPercent(0.1234)).toBe("12.3%");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("returns N/A for null", () => {
    expect(formatPercent(null)).toBe("N/A");
  });
});

describe("formatLargeNumber", () => {
  it.each([
    [2_500_000_000_000, "2.5T"],
    [3_700_000_000, "3.7B"],
    [12_500_000, "12.5M"],
    [4_300, "4.3K"],
    [42, "42"],
  ])("formats %i as %s", (input, output) => {
    expect(formatLargeNumber(input)).toBe(output);
  });

  it("returns N/A for null", () => {
    expect(formatLargeNumber(null)).toBe("N/A");
  });
});
