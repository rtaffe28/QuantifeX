import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const postRefreshMock = vi.fn();
vi.mock("@/api/token", () => ({
  default: { postRefresh: (...args: unknown[]) => postRefreshMock(...args) },
}));

import { useAuthCheck } from "../useAuthCheck";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";
import { makeJwt } from "@/test/utils";

beforeEach(() => {
  postRefreshMock.mockReset();
});

describe("useAuthCheck", () => {
  it("reports unauthenticated when no token stored", async () => {
    const { result } = renderHook(() => useAuthCheck());
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it("reports authenticated for a fresh token", async () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem(ACCESS_TOKEN, makeJwt({ exp: future }));

    const { result } = renderHook(() => useAuthCheck());
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it("refreshes when access token is expired and refresh succeeds", async () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(ACCESS_TOKEN, makeJwt({ exp: past }));
    localStorage.setItem(REFRESH_TOKEN, "refresh-token");
    postRefreshMock.mockResolvedValue({ status: 200, data: { access: "new-access" } });

    const { result } = renderHook(() => useAuthCheck());
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe("new-access");
  });

  it("returns false when refresh token missing", async () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(ACCESS_TOKEN, makeJwt({ exp: past }));
    // No refresh token

    const { result } = renderHook(() => useAuthCheck());
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it("clears tokens and returns false when refresh fails", async () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(ACCESS_TOKEN, makeJwt({ exp: past }));
    localStorage.setItem(REFRESH_TOKEN, "refresh-token");
    postRefreshMock.mockRejectedValue(new Error("server down"));

    const { result } = renderHook(() => useAuthCheck());
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
    expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN)).toBeNull();
  });
});
