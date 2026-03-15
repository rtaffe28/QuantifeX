import React from "react";
import { SimpleGrid, Box, Text } from "@chakra-ui/react";
import type { StockDetail } from "@/models/StockDetail";
import { formatMarketCap, formatPercent, toUSD } from "@/lib/formatters";

interface KeyStatsGridProps {
  stockDetail: StockDetail;
}

const StatCell: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <Box p={3} bg="bg.muted" borderRadius="md">
    <Text fontSize="xs" color="fg.muted" mb={1}>
      {label}
    </Text>
    <Text fontSize="sm" fontWeight="bold" color="fg.default">
      {value}
    </Text>
  </Box>
);

export const KeyStatsGrid: React.FC<KeyStatsGridProps> = ({ stockDetail }) => {
  return (
    <SimpleGrid columns={4} gap={3} mb={6}>
      <StatCell label="Market Cap" value={formatMarketCap(stockDetail.market_cap)} />
      <StatCell
        label="P/E Ratio"
        value={stockDetail.pe_ratio != null ? stockDetail.pe_ratio.toFixed(2) : "N/A"}
      />
      <StatCell label="Div Yield" value={formatPercent(stockDetail.dividend_yield)} />
      <StatCell
        label="Beta"
        value={stockDetail.volatility.beta != null ? stockDetail.volatility.beta.toFixed(2) : "N/A"}
      />
      <StatCell
        label="52W High"
        value={stockDetail.fifty_two_week_high != null ? toUSD(stockDetail.fifty_two_week_high) : "N/A"}
      />
      <StatCell
        label="52W Low"
        value={stockDetail.fifty_two_week_low != null ? toUSD(stockDetail.fifty_two_week_low) : "N/A"}
      />
      <StatCell label="30d Volatility" value={formatPercent(stockDetail.volatility.std_dev_30d)} />
      <StatCell label="90d Volatility" value={formatPercent(stockDetail.volatility.std_dev_90d)} />
    </SimpleGrid>
  );
};
