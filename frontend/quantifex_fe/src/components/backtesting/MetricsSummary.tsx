import React from "react";
import { Box, Text, SimpleGrid } from "@chakra-ui/react";
import type { BacktestResult } from "@/models/Backtest";
import { toUSD } from "@/lib/formatters";

interface MetricsSummaryProps {
  result: BacktestResult;
}

const Metric: React.FC<{ label: string; value: string; positive?: boolean | null }> = ({
  label,
  value,
  positive,
}) => (
  <Box p={3} bg="bg.subtle" borderRadius="md" borderWidth="1px" borderColor="border.default">
    <Text fontSize="xs" color="fg.muted" mb={1}>
      {label}
    </Text>
    <Text
      fontSize="lg"
      fontWeight="bold"
      color={positive === true ? "green.400" : positive === false ? "red.400" : "fg.default"}
    >
      {value}
    </Text>
  </Box>
);

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ result }) => {
  const fmtPct = (v: number | null) => (v == null ? "N/A" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`);
  const fmtDrawdown = (v: number) => `${v.toFixed(2)}%`;

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={3}>
        Performance Metrics
      </Text>
      <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
        <Metric
          label="Total Return"
          value={fmtPct(result.total_return_pct)}
          positive={result.total_return_pct >= 0}
        />
        <Metric
          label="Annualized Return"
          value={fmtPct(result.annualized_return_pct)}
          positive={result.annualized_return_pct != null ? result.annualized_return_pct >= 0 : null}
        />
        <Metric
          label="Max Drawdown"
          value={fmtDrawdown(result.max_drawdown_pct)}
          positive={false}
        />
        <Metric
          label="Sharpe Ratio"
          value={result.sharpe_ratio.toFixed(2)}
          positive={result.sharpe_ratio >= 1}
        />
        <Metric label="Total Trades" value={String(result.total_trades)} />
        <Metric label="Final Value" value={toUSD(result.final_portfolio_value)} />
      </SimpleGrid>
    </Box>
  );
};
