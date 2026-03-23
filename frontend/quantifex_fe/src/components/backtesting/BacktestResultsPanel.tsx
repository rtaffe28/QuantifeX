import React from "react";
import { Box, Text, Spinner, Flex } from "@chakra-ui/react";
import type { BacktestRun } from "@/models/Backtest";
import { MetricsSummary } from "./MetricsSummary";
import { EquityCurveChart } from "./EquityCurveChart";
import { TradeLogTable } from "./TradeLogTable";

interface BacktestResultsPanelProps {
  run: BacktestRun | null;
}

export const BacktestResultsPanel: React.FC<BacktestResultsPanelProps> = ({ run }) => {
  if (!run) {
    return (
      <Flex h="full" align="center" justify="center">
        <Text color="fg.muted">Configure and run a backtest to see results.</Text>
      </Flex>
    );
  }

  if (run.status === "pending" || run.status === "running") {
    return (
      <Flex h="full" direction="column" align="center" justify="center" gap={4}>
        <Spinner size="lg" color="teal.500" />
        <Text color="fg.muted">Running backtest for {run.ticker}...</Text>
      </Flex>
    );
  }

  if (run.status === "failed") {
    return (
      <Flex h="full" align="center" justify="center" direction="column" gap={2}>
        <Text color="red.400" fontWeight="bold">Backtest failed</Text>
        {run.error_message && (
          <Text color="fg.muted" fontSize="sm" maxW="400px" textAlign="center">
            {run.error_message}
          </Text>
        )}
      </Flex>
    );
  }

  if (!run.result) {
    return (
      <Flex h="full" align="center" justify="center">
        <Text color="fg.muted">No results available.</Text>
      </Flex>
    );
  }

  return (
    <Box>
      <Box mb={4}>
        <Text fontSize="xl" fontWeight="bold" color="fg.default">
          {run.ticker.toUpperCase()} — {run.strategy.replace(/_/g, " ")}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {run.start_date} → {run.end_date} · Initial capital: ${run.initial_capital.toLocaleString()}
        </Text>
      </Box>
      <MetricsSummary result={run.result} />
      {run.result.equity_curve.length > 0 && (
        <EquityCurveChart equityCurve={run.result.equity_curve} />
      )}
      <TradeLogTable tradeLog={run.result.trade_log} />
    </Box>
  );
};
