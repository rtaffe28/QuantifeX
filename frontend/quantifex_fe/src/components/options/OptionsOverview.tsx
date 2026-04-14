import React from "react";
import { SimpleGrid, Box, Text, Flex } from "@chakra-ui/react";
import type { OptionsData } from "@/models/OptionsData";
import { toUSD, formatLargeNumber } from "@/lib/formatters";

interface OptionsOverviewProps {
  data: OptionsData;
}

const StatCell: React.FC<{ label: string; value: string; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <Box p={3} bg="bg.muted" borderRadius="md">
    <Text fontSize="xs" color="fg.muted" mb={1}>
      {label}
    </Text>
    <Text fontSize="sm" fontWeight="bold" color="fg.default">
      {value}
    </Text>
    {hint && (
      <Text fontSize="xs" color="fg.muted" mt={0.5}>
        {hint}
      </Text>
    )}
  </Box>
);

export const OptionsOverview: React.FC<OptionsOverviewProps> = ({ data }) => {
  const { summary, iv_rv, days_to_expiry, current_price } = data;
  const pcVolLabel =
    summary.pc_volume_ratio != null
      ? summary.pc_volume_ratio.toFixed(2)
      : "N/A";
  const pcOILabel =
    summary.pc_oi_ratio != null ? summary.pc_oi_ratio.toFixed(2) : "N/A";

  const pcSentiment = (ratio: number | null) => {
    if (ratio == null) return "";
    if (ratio > 1.2) return "Bearish";
    if (ratio < 0.8) return "Bullish";
    return "Neutral";
  };

  return (
    <Box mb={6}>
      <Flex justify="space-between" align="center" mb={3}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="fg.default">
            {data.symbol}
          </Text>
          <Text fontSize="md" color="fg.muted">
            {data.name}
          </Text>
        </Box>
        <Box textAlign="right">
          <Text fontSize="2xl" fontWeight="bold" color="fg.default">
            {current_price ? toUSD(current_price) : "N/A"}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Exp: {data.selected_expiration}
            {days_to_expiry != null && ` (${days_to_expiry} DTE)`}
          </Text>
        </Box>
      </Flex>
      <SimpleGrid columns={4} gap={3}>
        <StatCell
          label="ATM Implied Vol"
          value={iv_rv.atm_iv != null ? `${iv_rv.atm_iv.toFixed(1)}%` : "N/A"}
        />
        <StatCell
          label="P/C Volume Ratio"
          value={pcVolLabel}
          hint={pcSentiment(summary.pc_volume_ratio)}
        />
        <StatCell
          label="P/C Open Interest"
          value={pcOILabel}
          hint={pcSentiment(summary.pc_oi_ratio)}
        />
        <StatCell
          label="Max Pain"
          value={summary.max_pain != null ? toUSD(summary.max_pain) : "N/A"}
        />
        <StatCell
          label="Total Call Volume"
          value={formatLargeNumber(summary.total_call_volume)}
        />
        <StatCell
          label="Total Put Volume"
          value={formatLargeNumber(summary.total_put_volume)}
        />
        <StatCell
          label="Total Call OI"
          value={formatLargeNumber(summary.total_call_oi)}
        />
        <StatCell
          label="Total Put OI"
          value={formatLargeNumber(summary.total_put_oi)}
        />
      </SimpleGrid>
    </Box>
  );
};
