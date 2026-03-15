import React, { useState, useEffect, useCallback, useRef } from "react";
import { Flex, Box } from "@chakra-ui/react";
import tickerService from "@/api/ticker";
import watchlistService from "@/api/watchlist";
import stockService from "@/api/stock";
import type { WatchlistItem } from "@/models/WatchlistItem";
import type { StockDetail } from "@/models/StockDetail";
import { WatchlistSidebar } from "@/components/watchlist/WatchlistSidebar";
import { StockDetailPanel } from "@/components/watchlist/StockDetailPanel";
import type { TimeRange } from "@/components/watchlist/PriceHistoryChart";

interface TickerItem {
  name: string;
  symbol: string;
}

const TIME_RANGE_PERIOD: Record<TimeRange, string> = {
  "1M": "1y",
  "3M": "1y",
  "6M": "1y",
  "1Y": "1y",
  "5Y": "5y",
  ALL: "max",
};

// Cache keyed by "SYMBOL:period"
type DetailCache = Map<string, StockDetail>;

const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [allTickers, setAllTickers] = useState<TickerItem[]>([]);
  const [tickersLoading, setTickersLoading] = useState(true);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [stockDetail, setStockDetail] = useState<StockDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const cacheRef = useRef<DetailCache>(new Map());

  const fetchWatchlist = useCallback(async () => {
    const res = await watchlistService.getWatchlist();
    setWatchlist(res.data);
  }, []);

  useEffect(() => {
    async function init() {
      setTickersLoading(true);
      const [tickerRes] = await Promise.all([
        tickerService.getTickers(),
        fetchWatchlist(),
      ]);
      setAllTickers(tickerRes.data);
      setTickersLoading(false);
    }
    init();
  }, [fetchWatchlist]);

  const fetchAndCache = useCallback(async (symbol: string, period: string) => {
    const key = `${symbol}:${period}`;
    const cached = cacheRef.current.get(key);
    if (cached) return cached;
    const res = await stockService.getStockDetail(symbol, period);
    cacheRef.current.set(key, res.data);
    return res.data;
  }, []);

  // Prefetch 5y and max in the background after initial 1y load
  const prefetch = useCallback((symbol: string) => {
    fetchAndCache(symbol, "5y").catch(() => {});
    fetchAndCache(symbol, "max").catch(() => {});
  }, [fetchAndCache]);

  const handleSelectTicker = useCallback(async (symbol: string) => {
    setSelectedTicker(symbol);
    // Clear cache for previous ticker
    cacheRef.current = new Map();
    setDetailLoading(true);
    try {
      const data = await fetchAndCache(symbol, "1y");
      setStockDetail(data);
      // Kick off background prefetch for 5y and max
      prefetch(symbol);
    } catch {
      setStockDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [fetchAndCache, prefetch]);

  const handleTimeRangeChange = useCallback(async (range: TimeRange) => {
    if (!selectedTicker) return;
    const period = TIME_RANGE_PERIOD[range];
    if (period === "1y") return;
    try {
      const data = await fetchAndCache(selectedTicker, period);
      setStockDetail(data);
    } catch {
      // keep existing data on failure
    }
  }, [selectedTicker, fetchAndCache]);

  const handleAddTicker = useCallback(
    async (symbol: string) => {
      const alreadyInList = watchlist.some((w) => w.ticker === symbol);
      if (alreadyInList) return;
      await watchlistService.addToWatchlist(symbol);
      await fetchWatchlist();
    },
    [watchlist, fetchWatchlist]
  );

  const handleRemoveTicker = useCallback(
    async (id: number) => {
      const item = watchlist.find((w) => w.id === id);
      await watchlistService.deleteFromWatchlist(id);
      await fetchWatchlist();
      if (item && item.ticker === selectedTicker) {
        setSelectedTicker(null);
        setStockDetail(null);
      }
    },
    [watchlist, selectedTicker, fetchWatchlist]
  );

  return (
    <Flex h="calc(100vh - 60px)" overflow="hidden">
      <Box
        w="320px"
        minW="320px"
        borderRightWidth="1px"
        borderColor="border.muted"
        p={4}
        overflowY="auto"
      >
        <WatchlistSidebar
          watchlist={watchlist}
          selectedTicker={selectedTicker}
          onSelectTicker={handleSelectTicker}
          onAddTicker={handleAddTicker}
          onRemoveTicker={handleRemoveTicker}
          allTickers={allTickers}
          tickersLoading={tickersLoading}
        />
      </Box>
      <Box flex={1} p={6} overflowY="auto">
        <StockDetailPanel
          stockDetail={stockDetail}
          loading={detailLoading}
          onTimeRangeChange={handleTimeRangeChange}
        />
      </Box>
    </Flex>
  );
};

export default WatchlistPage;
