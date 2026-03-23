import React from "react";
import { Box, Text, SimpleGrid } from "@chakra-ui/react";
import type { MonteCarloStats } from "@/models/MonteCarlo";
import { toUSD } from "@/lib/formatters";

interface ProbabilityStatsProps {
  stats: MonteCarloStats;
}

const StatCard: React.FC<{ label: string; value: string; positive?: boolean | null }> = ({
  label,
  value,
  positive,
}) => (
  <Box p={3} bg="bg.subtle" borderRadius="md" borderWidth="1px" borderColor="border.default">
    <Text fontSize="xs" color="fg.muted" mb={1}>{label}</Text>
    <Text
      fontSize="md"
      fontWeight="bold"
      color={
        positive === true ? "green.400" : positive === false ? "red.400" : "fg.default"
      }
    >
      {value}
    </Text>
  </Box>
);

export const ProbabilityStats: React.FC<ProbabilityStatsProps> = ({ stats }) => {
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={3}>
        Probability Statistics
      </Text>
      <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
        <StatCard label="Median Final Value" value={toUSD(stats.median_final)} />
        <StatCard label="Mean Final Value" value={toUSD(stats.mean_final)} />
        <StatCard label="10th Percentile" value={toUSD(stats.p10_final)} positive={false} />
        <StatCard label="90th Percentile" value={toUSD(stats.p90_final)} positive={true} />
        <StatCard label="Prob. of Doubling" value={pct(stats.prob_double)} positive={stats.prob_double > 0.5} />
        <StatCard label="Prob. of Loss" value={pct(stats.prob_loss)} positive={stats.prob_loss < 0.1 ? null : false} />
      </SimpleGrid>
    </Box>
  );
};
