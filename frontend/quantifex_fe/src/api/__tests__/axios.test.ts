/**
 * The axios instance attaches the access token to every request when present.
 * That's a one-line interceptor but it's load-bearing for every API call.
 */
import { describe, expect, it } from "vitest";
import axiosInstance from "../axios";
import { ACCESS_TOKEN } from "@/constants";

async function runInterceptor(config: { headers: Record<string, string> }) {
  // Pluck the first interceptor handler (the one we register in axios.ts) and run it.
  const handler =
    (axiosInstance.interceptors.request as any).handlers[0]?.fulfilled;
  return handler?.(config) ?? config;
}

describe("axios request interceptor", () => {
  it("adds Authorization header when token present", async () => {
    localStorage.setItem(ACCESS_TOKEN, "test-token");
    const out = await runInterceptor({ headers: {} });
    expect(out.headers.Authorization).toBe("Bearer test-token");
  });

  it("does not add header when no token", async () => {
    const out = await runInterceptor({ headers: {} });
    expect(out.headers.Authorization).toBeUndefined();
  });
});

describe("axios baseURL", () => {
  it("uses the /api prefix", () => {
    expect(axiosInstance.defaults.baseURL).toBe("/api");
  });
});
