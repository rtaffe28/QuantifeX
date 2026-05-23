import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./utils";

describe("vitest harness", () => {
  it("renders JSX with Chakra+Router providers", () => {
    renderWithProviders(<div data-testid="hello">hi</div>);
    expect(screen.getByTestId("hello")).toHaveTextContent("hi");
  });

  it("clears localStorage between tests (first)", () => {
    localStorage.setItem("test_key", "value");
    expect(localStorage.getItem("test_key")).toBe("value");
  });

  it("clears localStorage between tests (second)", () => {
    expect(localStorage.getItem("test_key")).toBeNull();
  });
});
