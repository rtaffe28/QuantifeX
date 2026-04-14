import React, { useState, useEffect, useCallback } from "react";
import { Flex, Box } from "@chakra-ui/react";
import tickerService from "@/api/ticker";
import watchlistService from "@/api/watchlist";
import optionsService from "@/api/options";
import type { WatchlistItem } from "@/models/WatchlistItem";
import type { OptionsData } from "@/models/OptionsData";
import { WatchlistSidebar } from "@/components/watchlist/WatchlistSidebar";
import { OptionsDetailPanel } from "@/components/options/OptionsDetailPanel";

interface TickerItem {
  name: string;
  symbol: string;
}

const OptionsPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [allTickers, setAllTickers] = useState<TickerItem[]>([]);
  const [tickersLoading, setTickersLoading] = useState(true);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [optionsData, setOptionsData] = useState<OptionsData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expirations, setExpirations] = useState<string[]>([]);
  const [selectedExpiration, setSelectedExpiration] = useState("");

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

  const fetchOptions = useCallback(
    async (symbol: string, expiration?: string) => {
      setDetailLoading(true);
      try {
        const res = await optionsService.getOptionsData(symbol, expiration);
        const data: OptionsData = res.data;
        setOptionsData(data);
        setExpirations(data.expirations);
        if (!expiration) {
          setSelectedExpiration(data.selected_expiration);
        }
      } catch {
        setOptionsData(null);
        setExpirations([]);
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  const handleSelectTicker = useCallback(
    (symbol: string) => {
      setSelectedTicker(symbol);
      setSelectedExpiration("");
      fetchOptions(symbol);
    },
    [fetchOptions]
  );

  const handleExpirationChange = useCallback(
    (exp: string) => {
      if (!selectedTicker) return;
      setSelectedExpiration(exp);
      fetchOptions(selectedTicker, exp);
    },
    [selectedTicker, fetchOptions]
  );

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
        setOptionsData(null);
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
        <OptionsDetailPanel
          data={optionsData}
          loading={detailLoading}
          expirations={expirations}
          selectedExpiration={selectedExpiration}
          onExpirationChange={handleExpirationChange}
        />
      </Box>
    </Flex>
  );
};

export default OptionsPage;
