/**
 * The Kelly math is internal to the component; we exercise it via the rendered
 * full/half/quarter Kelly outputs.
 *
 *   Full Kelly with p=55%, avg_win=2, avg_loss=1, b=2:
 *     f* = (b*p - q) / b = (2*0.55 - 0.45) / 2 = 0.65 / 2 = 0.325 = 32.5%
 */
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { KellyCriterionCalculator } from "../KellyCriterionCalculator";

describe("KellyCriterionCalculator", () => {
  it("renders default Kelly outputs", () => {
    renderWithProviders(<KellyCriterionCalculator />);
    // Defaults: winRate=55, avgWin=2, avgLoss=1 -> full Kelly ≈ 32.50%
    // The component formats with .toFixed(2) so the substring 32.50 should appear.
    const matches = screen.getAllByText((text) => text.includes("32.50"));
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders all four input defaults", () => {
    renderWithProviders(<KellyCriterionCalculator />);
    expect(screen.getByDisplayValue("55")).toBeInTheDocument();    // win rate
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();     // avg win
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();     // avg loss
    expect(screen.getByDisplayValue("10000")).toBeInTheDocument(); // account size
  });
});
