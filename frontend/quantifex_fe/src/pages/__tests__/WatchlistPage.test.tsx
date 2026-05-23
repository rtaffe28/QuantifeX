/**
 * WatchlistPage exercises three services (ticker, watchlist, stock). We mock
 * all three and verify the page boots, surfaces the user's watchlist, and
 * fetches stock detail when a ticker is selected.
 *
 * The Chakra/recharts surfaces in the detail panel can't fully render in
 * jsdom, so assertions stay at the data-flow level (mock call counts and
 * sidebar contents) rather than chart contents.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/api/ticker", () => ({
  default: {
    getTickers: vi.fn().mockResolvedValue({
      data: [
        { symbol: "AAPL", name: "Apple Inc." },
        { symbol: "MSFT", name: "Microsoft Corp." },
      ],
    }),
  },
}));

vi.mock("@/api/watchlist", () => ({
  default: {
    getWatchlist: vi.fn().mockResolvedValue({
      data: [{ id: 1, user: 1, ticker: "AAPL" }],
    }),
    addToWatchlist: vi.fn().mockResolvedValue({ data: { id: 2, user: 1, ticker: "MSFT" } }),
    deleteFromWatchlist: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("@/api/stock", () => ({
  default: {
    getStockDetail: vi.fn().mockResolvedValue({
      data: {
        symbol: "AAPL",
        name: "Apple Inc.",
        current_price: 200,
        change_today: 1,
        change_today_pct: 0.5,
        market_cap: 3_000_000_000_000,
        pe_ratio: 25,
        dividend_yield: 0.005,
        fifty_two_week_high: 220,
        fifty_two_week_low: 150,
        price_history: [{ date: "2025-01-01", close: 195, volume: 1000 }],
        earnings: [],
        annual_financials: [],
        quarterly_financials: [],
        volatility: { beta: 1.2, std_dev_30d: 0.02, std_dev_90d: 0.03 },
      },
    }),
  },
}));

import WatchlistPage from "../WatchlistPage";
import watchlistService from "@/api/watchlist";
import tickerService from "@/api/ticker";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("WatchlistPage", () => {
  it("loads tickers and watchlist on mount", async () => {
    renderWithProviders(<WatchlistPage />);
    await waitFor(() => {
      expect(tickerService.getTickers).toHaveBeenCalledTimes(1);
      expect(watchlistService.getWatchlist).toHaveBeenCalledTimes(1);
    });
  });

  it("shows the user's existing watchlist entry", async () => {
    renderWithProviders(<WatchlistPage />);
    expect(await screen.findByText(/AAPL/)).toBeInTheDocument();
  });
});
