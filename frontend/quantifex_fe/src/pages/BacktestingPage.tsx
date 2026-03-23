import React, { useState, useEffect, useCallback, useRef } from "react";
import { Flex, Box, Text } from "@chakra-ui/react";
import backtestingService from "@/api/backtesting";
import type { BacktestRun, StrategyDefinition } from "@/models/Backtest";
import { BacktestConfigForm } from "@/components/backtesting/BacktestConfigForm";
import { BacktestResultsPanel } from "@/components/backtesting/BacktestResultsPanel";
import { RunHistory } from "@/components/backtesting/RunHistory";

const BacktestingPage: React.FC = () => {
  const [strategies, setStrategies] = useState<StrategyDefinition[]>([]);
  const [runs, setRuns] = useState<BacktestRun[]>([]);
  const [activeRun, setActiveRun] = useState<BacktestRun | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRuns = useCallback(async () => {
    const res = await backtestingService.getBacktestRuns();
    setRuns(res.data);
    return res.data as BacktestRun[];
  }, []);

  useEffect(() => {
    backtestingService.getStrategies().then((res) => setStrategies(res.data));
    fetchRuns();
  }, [fetchRuns]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (runId: number) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        const res = await backtestingService.getBacktestRun(runId);
        const updated = res.data as BacktestRun;
        setActiveRun(updated);
        setRuns((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        if (updated.status === "complete" || updated.status === "failed") {
          stopPolling();
          setSubmitting(false);
        }
      }, 2000);
    },
    [stopPolling]
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleSubmit = useCallback(
    async (payload: Parameters<typeof backtestingService.submitBacktest>[0]) => {
      setSubmitting(true);
      const res = await backtestingService.submitBacktest(payload);
      const newRun = res.data as BacktestRun;
      setActiveRun(newRun);
      setRuns((prev) => [newRun, ...prev]);
      if (newRun.status === "complete" || newRun.status === "failed") {
        setSubmitting(false);
      } else {
        startPolling(newRun.id);
      }
    },
    [startPolling]
  );

  const handleView = useCallback((run: BacktestRun) => {
    setActiveRun(run);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      await backtestingService.deleteBacktestRun(id);
      setRuns((prev) => prev.filter((r) => r.id !== id));
      if (activeRun?.id === id) setActiveRun(null);
    },
    [activeRun]
  );

  return (
    <Flex h="calc(100vh - 60px)" overflow="hidden">
      {/* Left Panel */}
      <Box
        w="320px"
        minW="320px"
        borderRightWidth="1px"
        borderColor="border.muted"
        p={4}
        overflowY="auto"
      >
        <Text fontSize="xl" fontWeight="bold" color="fg.default" mb={4}>
          Backtesting
        </Text>
        {strategies.length > 0 ? (
          <BacktestConfigForm
            strategies={strategies}
            onSubmit={handleSubmit}
            loading={submitting}
          />
        ) : (
          <Text color="fg.muted" fontSize="sm">Loading strategies...</Text>
        )}
        <RunHistory
          runs={runs}
          activeRunId={activeRun?.id ?? null}
          onView={handleView}
          onDelete={handleDelete}
        />
      </Box>

      {/* Right Panel */}
      <Box flex={1} p={6} overflowY="auto">
        <BacktestResultsPanel run={activeRun} />
      </Box>
    </Flex>
  );
};

export default BacktestingPage;
