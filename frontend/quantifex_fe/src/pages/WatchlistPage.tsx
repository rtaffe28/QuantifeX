import React, { useState, useEffect, useCallback } from "react";
import { Flex, Box } from "@chakra-ui/react";
import tickerService from "@/api/ticker";
import watchlistService from "@/api/watchlist";
import stockService from "@/api/stock";
import type { WatchlistItem } from "@/models/WatchlistItem";
import type { StockDetail } from "@/models/StockDetail";
import { WatchlistSidebar } from "@/components/watchlist/WatchlistSidebar";
import { StockDetailPanel } from "@/components/watchlist/StockDetailPanel";

interface TickerItem {
  name: string;
  symbol: string;
}

const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [allTickers, setAllTickers] = useState<TickerItem[]>([]);
  const [tickersLoading, setTickersLoading] = useState(true);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [stockDetail, setStockDetail] = useState<StockDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const handleSelectTicker = useCallback(async (symbol: string) => {
    setSelectedTicker(symbol);
    setDetailLoading(true);
    try {
      const res = await stockService.getStockDetail(symbol);
      setStockDetail(res.data);
    } catch {
      setStockDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

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
        />
      </Box>
    </Flex>
  );
};

export default WatchlistPage;
