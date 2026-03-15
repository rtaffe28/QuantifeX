import React from "react";
import { Flex, Text, Box } from "@chakra-ui/react";
import type { StockDetail } from "@/models/StockDetail";
import { toUSD } from "@/lib/formatters";

interface StockHeaderProps {
  stockDetail: StockDetail;
}

export const StockHeader: React.FC<StockHeaderProps> = ({ stockDetail }) => {
  const isPositive = (stockDetail.change_today ?? 0) >= 0;
  const changeColor = isPositive ? "up" : "down";

  return (
    <Flex justify="space-between" align="center" mb={6}>
      <Box>
        <Text fontSize="2xl" fontWeight="bold" color="fg.default">
          {stockDetail.symbol}
        </Text>
        <Text fontSize="md" color="fg.muted">
          {stockDetail.name}
        </Text>
      </Box>
      <Box textAlign="right">
        <Text fontSize="2xl" fontWeight="bold" color="fg.default">
          {stockDetail.current_price != null
            ? toUSD(stockDetail.current_price)
            : "N/A"}
        </Text>
        {stockDetail.change_today != null && (
          <Text fontSize="sm" color={changeColor} fontWeight="semibold">
            {isPositive ? "+" : ""}
            {stockDetail.change_today.toFixed(2)}{" "}
            ({isPositive ? "+" : ""}
            {stockDetail.change_today_pct != null
              ? stockDetail.change_today_pct.toFixed(2)
              : "0.00"}
            %)
          </Text>
        )}
      </Box>
    </Flex>
  );
};
