import React, { useState } from "react";
import { Flex, Box, Text, Button, Spinner } from "@chakra-ui/react";
import monteCarloService from "@/api/monteCarlo";
import type { Holding, MonteCarloResult } from "@/models/MonteCarlo";
import { HoldingsInput } from "@/components/montecarlo/HoldingsInput";
import { SimulationSettings } from "@/components/montecarlo/SimulationSettings";
import { FanChart } from "@/components/montecarlo/FanChart";
import { ProbabilityStats } from "@/components/montecarlo/ProbabilityStats";
import { SimulationSummary } from "@/components/montecarlo/SimulationSummary";

interface FormState {
  initialValue: number;
  monthlyContribution: number;
  years: number;
  simulations: number;
  historicalPeriod: string;
}

const DEFAULT_FORM: FormState = {
  initialValue: 10000,
  monthlyContribution: 500,
  years: 20,
  simulations: 1000,
  historicalPeriod: "10y",
};

const MonteCarloPage: React.FC = () => {
  const [holdings, setHoldings] = useState<Holding[]>([
    { ticker: "SPY", weight: 0.6 },
    { ticker: "BND", weight: 0.4 },
  ]);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = (field: string, value: number | string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const totalWeight = holdings.reduce((s, h) => s + h.weight, 0);
  const canRun =
    holdings.length >= 1 &&
    holdings.every((h) => h.ticker.trim()) &&
    Math.abs(totalWeight - 1) <= 0.015 &&
    !loading;

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await monteCarloService.runSimulation({
        holdings,
        initial_value: form.initialValue,
        monthly_contribution: form.monthlyContribution,
        years: form.years,
        simulations: form.simulations,
        historical_period: form.historicalPeriod,
        risk_free_rate: 0.05,
      });
      setResult(res.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        Object.values(err?.response?.data || {}).flat().join(" ") ||
        "Simulation failed. Check your inputs and try again.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex h="calc(100vh - 60px)" overflow="hidden">
      {/* Left Panel */}
      <Box
        w="300px"
        minW="300px"
        borderRightWidth="1px"
        borderColor="border.muted"
        p={4}
        overflowY="auto"
        display="flex"
        flexDirection="column"
        gap={5}
      >
        <Text fontSize="xl" fontWeight="bold" color="fg.default">
          Monte Carlo
        </Text>

        <HoldingsInput holdings={holdings} onChange={setHoldings} />

        <Box borderTopWidth="1px" borderColor="border.muted" pt={4}>
          <SimulationSettings {...form} onChange={updateForm} />
        </Box>

        {error && (
          <Text fontSize="sm" color="red.400">
            {error}
          </Text>
        )}

        <Button
          colorPalette="teal"
          size="sm"
          onClick={handleRun}
          disabled={!canRun}
          mt="auto"
        >
          {loading ? <Spinner size="sm" /> : "Run Simulation"}
        </Button>
      </Box>

      {/* Right Panel */}
      <Box flex={1} p={6} overflowY="auto">
        {!result && !loading && (
          <Flex h="full" align="center" justify="center">
            <Text color="fg.muted">
              Configure your portfolio and run a simulation to see results.
            </Text>
          </Flex>
        )}

        {loading && (
          <Flex h="full" direction="column" align="center" justify="center" gap={4}>
            <Spinner size="lg" color="teal.500" />
            <Text color="fg.muted">
              Running {form.simulations.toLocaleString()} simulations…
            </Text>
          </Flex>
        )}

        {result && !loading && (
          <>
            <SimulationSummary
              result={result}
              simulations={form.simulations}
              historicalPeriod={form.historicalPeriod}
            />
            <FanChart result={result} />
            <ProbabilityStats stats={result.stats} />
          </>
        )}
      </Box>
    </Flex>
  );
};

export default MonteCarloPage;
