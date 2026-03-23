import React from "react";
import { Box, Flex, Text, Badge } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import type { EarningsEvent } from "@/models/EarningsCalendar";
import { formatMarketCap } from "@/lib/formatters";

interface Props {
  event: EarningsEvent;
  watchlistTickers: string[];
}

function daysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

export const EarningsEventCard: React.FC<Props> = ({ event, watchlistTickers }) => {
  const navigate = useNavigate();
  const isInWatchlist = watchlistTickers.includes(event.ticker);

  const epsDelta =
    event.eps_estimate != null && event.eps_previous != null && event.eps_previous !== 0
      ? ((event.eps_estimate - event.eps_previous) / Math.abs(event.eps_previous)) * 100
      : null;

  const timeBadgeColor =
    event.earnings_time === "BMO"
      ? "blue"
      : event.earnings_time === "AMC"
      ? "orange"
      : "gray";

  const handleClick = () => {
    if (isInWatchlist) {
      navigate(`/watchlist?ticker=${event.ticker}`);
    }
  };

  return (
    <Box
      p={4}
      bg="bg.subtle"
      borderRadius="md"
      border="1px solid"
      borderColor="border.default"
      cursor={isInWatchlist ? "pointer" : "default"}
      _hover={isInWatchlist ? { borderColor: "teal.500", bg: "bg.muted" } : {}}
      transition="all 0.15s"
      onClick={handleClick}
    >
      <Flex align="center" justify="space-between" gap={4}>
        <Flex align="center" gap={3} flex={1}>
          <Badge colorPalette="teal" fontWeight="bold" fontSize="sm" px={2} py={1}>
            {event.ticker}
          </Badge>
          <Box>
            <Text fontWeight="semibold" fontSize="sm">{event.company_name}</Text>
            <Text fontSize="xs" color="fg.muted">{daysLabel(event.days_until)}</Text>
          </Box>
        </Flex>

        <Badge colorPalette={timeBadgeColor} fontSize="xs">
          {event.earnings_time}
        </Badge>

        <Box textAlign="right" minW="160px">
          <Flex align="center" justify="flex-end" gap={2}>
            <Text fontSize="sm" color="fg.muted">EPS Est:</Text>
            <Text fontSize="sm" fontWeight="semibold">
              {event.eps_estimate != null ? `$${event.eps_estimate.toFixed(2)}` : "N/A"}
            </Text>
          </Flex>
          <Flex align="center" justify="flex-end" gap={2}>
            <Text fontSize="sm" color="fg.muted">Prev EPS:</Text>
            <Text fontSize="sm">
              {event.eps_previous != null ? `$${event.eps_previous.toFixed(2)}` : "N/A"}
            </Text>
            {epsDelta != null && (
              <Text
                fontSize="xs"
                fontWeight="bold"
                color={epsDelta >= 0 ? "green.500" : "red.500"}
              >
                {epsDelta >= 0 ? "+" : ""}{epsDelta.toFixed(1)}%
              </Text>
            )}
          </Flex>
          <Flex align="center" justify="flex-end" gap={2}>
            <Text fontSize="sm" color="fg.muted">Rev Est:</Text>
            <Text fontSize="sm">{formatMarketCap(event.revenue_estimate)}</Text>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};
