/**
 * Token management helpers — they're load-bearing for auth, so worth testing
 * directly rather than only via components.
 */
import { describe, expect, it } from "vitest";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";
import {
  clearLocalAuthTokens,
  clearAllLocalStorage,
  getLocalAccessToken,
  getLocalRefreshToken,
  setLocalAuthTokens,
  isTokenExpired,
  isValidToken,
  getTokenPayload,
} from "../utils";
import { makeJwt } from "@/test/utils";

describe("setLocalAuthTokens", () => {
  it("stores access and refresh tokens", () => {
    setLocalAuthTokens("access-x", "refresh-y");
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe("access-x");
    expect(localStorage.getItem(REFRESH_TOKEN)).toBe("refresh-y");
  });

  it("dispatches a tokenUpdate event", () => {
    let fired = false;
    const handler = () => {
      fired = true;
    };
    window.addEventListener("tokenUpdate", handler);
    setLocalAuthTokens("a", "r");
    window.removeEventListener("tokenUpdate", handler);
    expect(fired).toBe(true);
  });
});

describe("clearLocalAuthTokens", () => {
  it("removes both tokens", () => {
    setLocalAuthTokens("a", "r");
    clearLocalAuthTokens();
    expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN)).toBeNull();
  });
});

describe("clearAllLocalStorage", () => {
  it("wipes everything", () => {
    localStorage.setItem("unrelated", "x");
    setLocalAuthTokens("a", "r");
    clearAllLocalStorage();
    expect(localStorage.getItem("unrelated")).toBeNull();
    expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull();
  });
});

describe("getLocalAccessToken / getLocalRefreshToken", () => {
  it("returns null when unset", () => {
    expect(getLocalAccessToken()).toBeNull();
    expect(getLocalRefreshToken()).toBeNull();
  });

  it("returns the value when set", () => {
    setLocalAuthTokens("a", "r");
    expect(getLocalAccessToken()).toBe("a");
    expect(getLocalRefreshToken()).toBe("r");
  });
});

describe("isTokenExpired", () => {
  it("returns true for past-exp token", () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    expect(isTokenExpired(makeJwt({ exp: past }))).toBe(true);
  });

  it("returns false for future-exp token", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    expect(isTokenExpired(makeJwt({ exp: future }))).toBe(false);
  });

  it("returns true for malformed token", () => {
    expect(isTokenExpired("not-a-jwt")).toBe(true);
  });
});

describe("isValidToken", () => {
  it("returns false for null", () => {
    expect(isValidToken(null)).toBe(false);
  });

  it("returns true for fresh JWT", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    expect(isValidToken(makeJwt({ exp: future }))).toBe(true);
  });
});

describe("getTokenPayload", () => {
  it("returns decoded payload", () => {
    const token = makeJwt({ user_id: 42, username: "alice", exp: 1234567 });
    expect(getTokenPayload(token)).toMatchObject({ user_id: 42, username: "alice" });
  });

  it("returns null for malformed token", () => {
    expect(getTokenPayload("garbage")).toBeNull();
  });
});
