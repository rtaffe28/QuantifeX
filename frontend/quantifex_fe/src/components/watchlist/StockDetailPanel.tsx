import React, { useState, useMemo } from "react";
import { Box, Text, Spinner, Flex } from "@chakra-ui/react";
import type { StockDetail, PricePoint } from "@/models/StockDetail";
import { StockHeader } from "./StockHeader";
import { KeyStatsGrid } from "./KeyStatsGrid";
import { PriceHistoryChart, type TimeRange } from "./PriceHistoryChart";
import { VolumeChart } from "./VolumeChart";
import { FinancialsChart } from "./FinancialsChart";

interface StockDetailPanelProps {
  stockDetail: StockDetail | null;
  loading: boolean;
  onTimeRangeChange?: (range: TimeRange) => void;
}

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "5Y": 1825,
  ALL: Infinity,
};

// Max data points to render in the chart — keeps it snappy
const MAX_POINTS = 300;

function downsample(data: PricePoint[], maxPoints: number): PricePoint[] {
  if (data.length <= maxPoints) return data;
  const step = data.length / maxPoints;
  const result: PricePoint[] = [];
  for (let i = 0; i < maxPoints - 1; i++) {
    result.push(data[Math.round(i * step)]);
  }
  // Always include the last point for accurate current price
  result.push(data[data.length - 1]);
  return result;
}

export const StockDetailPanel: React.FC<StockDetailPanelProps> = ({
  stockDetail,
  loading,
  onTimeRangeChange,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("1Y");

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    onTimeRangeChange?.(range);
  };

  const filteredHistory = useMemo(() => {
    if (!stockDetail) return [];
    const days = TIME_RANGE_DAYS[timeRange];
    let data: PricePoint[];
    if (days === Infinity) {
      data = stockDetail.price_history;
    } else {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      data = stockDetail.price_history.filter(
        (p) => new Date(p.date) >= cutoff
      );
    }
    return downsample(data, MAX_POINTS);
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
        onTimeRangeChange={handleTimeRangeChange}
      />
      <VolumeChart priceHistory={filteredHistory} />
      <FinancialsChart
        annual={stockDetail.annual_financials}
        quarterly={stockDetail.quarterly_financials}
      />
    </Box>
  );
};
