import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import earningsCalendarService from "@/api/earningsCalendar";
import watchlistService from "@/api/watchlist";
import type { EarningsEvent } from "@/models/EarningsCalendar";
import { EarningsCalendarHeader } from "@/components/earnings/EarningsCalendarHeader";
import { AddTickerBar } from "@/components/earnings/AddTickerBar";
import { EarningsListView } from "@/components/earnings/EarningsListView";
import { EarningsCalendarGrid } from "@/components/earnings/EarningsCalendarGrid";

type ViewMode = "list" | "calendar";

const EarningsCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<EarningsEvent[]>([]);
  const [watchlistTickers, setWatchlistTickers] = useState<string[]>([]);
  const [extraTickers, setExtraTickers] = useState<string[]>([]);
  const [daysAhead, setDaysAhead] = useState(90);
  const [view, setView] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load watchlist tickers on mount
  useEffect(() => {
    watchlistService.getWatchlist().then((res) => {
      const tickers: string[] = (res.data ?? []).map((item: { ticker: string }) =>
        item.ticker.toUpperCase()
      );
      setWatchlistTickers(tickers);
    }).catch(() => {});
  }, []);

  const fetchCalendar = useCallback((tickers: string[], days: number) => {
    setLoading(true);
    const allTickers = tickers.join(",");
    earningsCalendarService
      .getEarningsCalendar({ tickers: allTickers || undefined, days_ahead: days })
      .then((res) => {
        setEvents(res.data.events ?? []);
        setLastUpdated(new Date());
      })
      .catch(() => {
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Debounced fetch when tickers or daysAhead change
  useEffect(() => {
    if (watchlistTickers.length === 0 && extraTickers.length === 0) return;
    const allTickers = [...watchlistTickers, ...extraTickers];
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCalendar(allTickers, daysAhead);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watchlistTickers, extraTickers, daysAhead, fetchCalendar]);

  const handleRefresh = () => {
    const allTickers = [...watchlistTickers, ...extraTickers];
    fetchCalendar(allTickers, daysAhead);
  };

  const handleAddTicker = (ticker: string) => {
    setExtraTickers((prev) => [...prev, ticker]);
  };

  const handleRemoveTicker = (ticker: string) => {
    setExtraTickers((prev) => prev.filter((t) => t !== ticker));
  };

  const handleResetToWatchlist = () => {
    setExtraTickers([]);
  };

  return (
    <Box p={6} maxW="1100px" mx="auto">
      <EarningsCalendarHeader
        view={view}
        onViewChange={setView}
        daysAhead={daysAhead}
        onDaysAheadChange={setDaysAhead}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <AddTickerBar
        watchlistTickers={watchlistTickers}
        extraTickers={extraTickers}
        onAddTicker={handleAddTicker}
        onRemoveTicker={handleRemoveTicker}
        onResetToWatchlist={handleResetToWatchlist}
      />

      {loading && events.length === 0 ? (
        <Flex py={12} justify="center">
          <Text color="fg.muted">Loading earnings data...</Text>
        </Flex>
      ) : view === "list" ? (
        <EarningsListView events={events} watchlistTickers={watchlistTickers} />
      ) : (
        <EarningsCalendarGrid events={events} watchlistTickers={watchlistTickers} />
      )}
    </Box>
  );
};

export default EarningsCalendarPage;
