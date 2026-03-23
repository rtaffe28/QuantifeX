import React from "react";
import { Box, Text } from "@chakra-ui/react";
import type { MonteCarloResult } from "@/models/MonteCarlo";
import { toUSD } from "@/lib/formatters";

interface SimulationSummaryProps {
  result: MonteCarloResult;
  simulations: number;
  historicalPeriod: string;
}

const PERIOD_LABELS: Record<string, string> = {
  "3y": "3 years",
  "5y": "5 years",
  "10y": "10 years",
  "max": "all available",
};

export const SimulationSummary: React.FC<SimulationSummaryProps> = ({
  result,
  simulations,
  historicalPeriod,
}) => {
  const { stats, years } = result;
  const doubleChance = (stats.prob_double * 100).toFixed(0);
  const lossChance = (stats.prob_loss * 100).toFixed(1);
  const annReturn = (stats.expected_annual_return * 100).toFixed(1);
  const annVol = (stats.portfolio_volatility * 100).toFixed(1);
  const period = PERIOD_LABELS[historicalPeriod] ?? historicalPeriod;

  return (
    <Box
      p={4}
      bg="bg.subtle"
      borderRadius="md"
      borderWidth="1px"
      borderColor="border.default"
      mb={4}
    >
      <Text fontSize="sm" color="fg.muted" lineHeight="tall">
        Based on{" "}
        <Text as="span" fontWeight="semibold" color="fg.default">
          {simulations.toLocaleString()} simulations
        </Text>{" "}
        using{" "}
        <Text as="span" fontWeight="semibold" color="fg.default">
          {period} of historical returns
        </Text>{" "}
        (ann. return {annReturn}%, volatility {annVol}%), your portfolio has a{" "}
        <Text as="span" fontWeight="semibold" color="green.400">
          {doubleChance}% chance of doubling
        </Text>{" "}
        and a{" "}
        <Text as="span" fontWeight="semibold" color={parseFloat(lossChance) < 10 ? "green.400" : "red.400"}>
          {lossChance}% chance of losing money
        </Text>{" "}
        over {years} years. The median outcome is{" "}
        <Text as="span" fontWeight="semibold" color="teal.400">
          {toUSD(stats.median_final)}
        </Text>
        .
      </Text>
    </Box>
  );
};
