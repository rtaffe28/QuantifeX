/**
 * Service wrappers around the axios instance — thin, but worth pinning so a
 * route change doesn't silently break clients.
 *
 * We mock the axios singleton wholesale so each test can assert which URL and
 * payload would be sent without making real network calls.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import axiosInstance from "../axios";
import tokenService from "../token";
import userService from "../user";
import watchlistService from "../watchlist";
import transactionsService from "../transactions";
import backtestingService from "../backtesting";
import stockService from "../stock";
import optionsService from "../options";
import earningsCalendarService from "../earningsCalendar";
import monteCarloService from "../monteCarlo";
import tickerService from "../ticker";

const mock = axiosInstance as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  mock.get.mockClear();
  mock.post.mockClear();
  mock.delete.mockClear();
});

describe("tokenService", () => {
  it("postToken sends username & password to /token/", async () => {
    await tokenService.postToken("alice", "pw");
    expect(mock.post).toHaveBeenCalledWith("token/", { username: "alice", password: "pw" });
  });

  it("postRefresh sends refresh token to /token/refresh/", async () => {
    await tokenService.postRefresh("refresh-x");
    expect(mock.post).toHaveBeenCalledWith("/token/refresh/", { refresh: "refresh-x" });
  });
});

describe("userService", () => {
  it("registerUser posts to /user/register/", async () => {
    await userService.registerUser("alice", "pw");
    expect(mock.post).toHaveBeenCalledWith("user/register/", { username: "alice", password: "pw" });
  });

  it("getUser fetches /user/", async () => {
    await userService.getUser();
    expect(mock.get).toHaveBeenCalledWith("user/");
  });
});

describe("watchlistService", () => {
  it("lists watchlist", async () => {
    await watchlistService.getWatchlist();
    expect(mock.get).toHaveBeenCalledWith("watchlist/");
  });

  it("adds a ticker", async () => {
    await watchlistService.addToWatchlist("AAPL");
    expect(mock.post).toHaveBeenCalledWith("watchlist/", { ticker: "AAPL" });
  });

  it("deletes by id", async () => {
    await watchlistService.deleteFromWatchlist(7);
    expect(mock.delete).toHaveBeenCalledWith("watchlist/delete/7/");
  });
});

describe("transactionsService", () => {
  it("adds a transaction", async () => {
    const payload = { date: "2025-06-15", type: "buy", description: "x", amount: 100 };
    await transactionsService.addTransaction(payload);
    expect(mock.post).toHaveBeenCalledWith("transactions/", payload);
  });

  it("deletes a transaction", async () => {
    await transactionsService.deleteTransaction(3);
    expect(mock.delete).toHaveBeenCalledWith("transactions/delete/3/");
  });
});

describe("backtestingService", () => {
  it("lists strategies", async () => {
    await backtestingService.getStrategies();
    expect(mock.get).toHaveBeenCalledWith("backtesting/strategies/");
  });

  it("submits a run", async () => {
    const payload = {
      ticker: "AAPL",
      strategy: "buy_and_hold",
      parameters: {},
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      initial_capital: 10000,
    };
    await backtestingService.submitBacktest(payload);
    expect(mock.post).toHaveBeenCalledWith("backtesting/run/", payload);
  });

  it("fetches a single run by id", async () => {
    await backtestingService.getBacktestRun(5);
    expect(mock.get).toHaveBeenCalledWith("backtesting/runs/5/");
  });

  it("deletes a run", async () => {
    await backtestingService.deleteBacktestRun(5);
    expect(mock.delete).toHaveBeenCalledWith("backtesting/runs/5/");
  });
});

describe("stockService", () => {
  it("gets stock detail with default period", async () => {
    await stockService.getStockDetail("AAPL");
    expect(mock.get).toHaveBeenCalledWith("stock/AAPL/", { params: { period: "1y" } });
  });

  it("respects custom period", async () => {
    await stockService.getStockDetail("AAPL", "3mo");
    expect(mock.get).toHaveBeenCalledWith("stock/AAPL/", { params: { period: "3mo" } });
  });
});

describe("optionsService", () => {
  it("requests pricing with all params", async () => {
    await optionsService.getOptionsPrice({
      spot: 100, strike: 100, expiry_days: 30, iv: 0.2, rate: 0.05, option_type: "call",
    });
    expect(mock.get).toHaveBeenCalledWith("options/price/", expect.objectContaining({
      params: expect.objectContaining({ spot: 100, option_type: "call" }),
    }));
  });

  it("requests chain without expiration param when omitted", async () => {
    await optionsService.getOptionsData("AAPL");
    expect(mock.get).toHaveBeenCalledWith("options/AAPL/", { params: {} });
  });

  it("requests chain with expiration when given", async () => {
    await optionsService.getOptionsData("AAPL", "2026-06-19");
    expect(mock.get).toHaveBeenCalledWith("options/AAPL/", { params: { expiration: "2026-06-19" } });
  });
});

describe("earningsCalendarService", () => {
  it("calls without params when none given", async () => {
    await earningsCalendarService.getEarningsCalendar();
    expect(mock.get).toHaveBeenCalledWith("earnings-calendar/", { params: undefined });
  });

  it("passes params when given", async () => {
    await earningsCalendarService.getEarningsCalendar({ tickers: "AAPL,MSFT", days_ahead: 30 });
    expect(mock.get).toHaveBeenCalledWith("earnings-calendar/", {
      params: { tickers: "AAPL,MSFT", days_ahead: 30 },
    });
  });
});

describe("monteCarloService", () => {
  it("posts simulation payload", async () => {
    const payload = {
      holdings: [{ ticker: "AAPL", weight: 1 }],
      initial_value: 10000,
      monthly_contribution: 0,
      years: 5,
      simulations: 1000,
      historical_period: "10y",
      risk_free_rate: 0.05,
    };
    await monteCarloService.runSimulation(payload as any);
    expect(mock.post).toHaveBeenCalledWith("monte-carlo/simulate/", payload);
  });
});

describe("tickerService", () => {
  it("fetches /tickers/", async () => {
    await tickerService.getTickers();
    expect(mock.get).toHaveBeenCalledWith("tickers/");
  });
});
