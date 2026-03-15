import React, { useState, useMemo } from "react";
import { Box, Text, Spinner, Flex } from "@chakra-ui/react";
import type { StockDetail } from "@/models/StockDetail";
import { StockHeader } from "./StockHeader";
import { KeyStatsGrid } from "./KeyStatsGrid";
import { PriceHistoryChart, type TimeRange } from "./PriceHistoryChart";
import { VolumeChart } from "./VolumeChart";
import { EarningsChart } from "./EarningsChart";

interface StockDetailPanelProps {
  stockDetail: StockDetail | null;
  loading: boolean;
}

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  ALL: Infinity,
};

export const StockDetailPanel: React.FC<StockDetailPanelProps> = ({
  stockDetail,
  loading,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("1Y");

  const filteredHistory = useMemo(() => {
    if (!stockDetail) return [];
    const days = TIME_RANGE_DAYS[timeRange];
    if (days === Infinity) return stockDetail.price_history;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return stockDetail.price_history.filter(
      (p) => new Date(p.date) >= cutoff
    );
  }, [stockDetail, timeRange]);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="teal.solid" />
      </Flex>
    );
  }

  if (!stockDetail) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Text fontSize="lg" color="fg.muted">
          Select a ticker from your watchlist to view details
        </Text>
      </Flex>
    );
  }

  return (
    <Box>
      <StockHeader stockDetail={stockDetail} />
      <KeyStatsGrid stockDetail={stockDetail} />
      <PriceHistoryChart
        priceHistory={filteredHistory}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
      <VolumeChart priceHistory={filteredHistory} />
      <EarningsChart earnings={stockDetail.earnings} />
    </Box>
  );
};
