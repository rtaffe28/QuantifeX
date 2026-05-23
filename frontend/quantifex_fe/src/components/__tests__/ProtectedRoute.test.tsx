import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";

const useAuthCheckMock = vi.fn();
vi.mock("@/hooks/useAuthCheck", () => ({
  useAuthCheck: () => useAuthCheckMock(),
}));

import ProtectedRoute from "../ProtectedRoute";

describe("ProtectedRoute", () => {
  it("shows loading state while checking auth", () => {
    useAuthCheckMock.mockReturnValue({ isAuthenticated: false, loading: true });
    renderWithProviders(
      <ProtectedRoute>
        <div data-testid="child">secret</div>
      </ProtectedRoute>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("renders children when authenticated", () => {
    useAuthCheckMock.mockReturnValue({ isAuthenticated: true, loading: false });
    renderWithProviders(
      <ProtectedRoute>
        <div data-testid="child">secret</div>
      </ProtectedRoute>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows login prompt when unauthenticated", () => {
    useAuthCheckMock.mockReturnValue({ isAuthenticated: false, loading: false });
    renderWithProviders(
      <ProtectedRoute>
        <div data-testid="child">secret</div>
      </ProtectedRoute>
    );
    expect(screen.getByText(/login to view this page/i)).toBeInTheDocument();
    expect(screen.queryByTestId("child")).toBeNull();
  });
});
