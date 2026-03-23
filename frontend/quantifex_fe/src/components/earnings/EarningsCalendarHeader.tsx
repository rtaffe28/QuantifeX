import React from "react";
import { Box, Flex, Text, Button } from "@chakra-ui/react";
import { FiRefreshCw } from "react-icons/fi";

type ViewMode = "list" | "calendar";

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  daysAhead: number;
  onDaysAheadChange: (d: number) => void;
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

const DAY_OPTIONS = [30, 60, 90, 180];

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export const EarningsCalendarHeader: React.FC<Props> = ({
  view,
  onViewChange,
  daysAhead,
  onDaysAheadChange,
  lastUpdated,
  onRefresh,
  loading,
}) => {
  return (
    <Box mb={4}>
      <Flex align="center" justify="space-between" mb={3}>
        <Text fontSize="2xl" fontWeight="bold">Earnings Calendar</Text>
        <Flex align="center" gap={3}>
          {/* View toggle */}
          <Flex
            bg="bg.muted"
            borderRadius="md"
            p={0.5}
            gap={0.5}
          >
            {(["list", "calendar"] as ViewMode[]).map((v) => (
              <Box
                key={v}
                as="button"
                px={3}
                py={1}
                borderRadius="sm"
                fontSize="sm"
                fontWeight={view === v ? 600 : 400}
                bg={view === v ? "bg.subtle" : "transparent"}
                border={view === v ? "1px solid" : "1px solid transparent"}
                borderColor={view === v ? "border.default" : "transparent"}
                cursor="pointer"
                onClick={() => onViewChange(v)}
                textTransform="capitalize"
                transition="all 0.15s"
              >
                {v === "list" ? "List" : "Calendar"}
              </Box>
            ))}
          </Flex>

          {/* Last updated + refresh */}
          <Flex align="center" gap={2}>
            {lastUpdated && (
              <Text fontSize="xs" color="fg.muted">Updated {timeAgo(lastUpdated)}</Text>
            )}
            <Button
              size="xs"
              variant="outline"
              onClick={onRefresh}
              loading={loading}
            >
              <FiRefreshCw />
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {/* Days ahead segmented control */}
      <Flex align="center" gap={2}>
        <Text fontSize="sm" color="fg.muted" mr={1}>Show:</Text>
        <Flex bg="bg.muted" borderRadius="md" p={0.5} gap={0.5}>
          {DAY_OPTIONS.map((d) => (
            <Box
              key={d}
              as="button"
              px={3}
              py={1}
              borderRadius="sm"
              fontSize="sm"
              fontWeight={daysAhead === d ? 600 : 400}
              bg={daysAhead === d ? "teal.500" : "transparent"}
              color={daysAhead === d ? "white" : "fg.default"}
              cursor="pointer"
              onClick={() => onDaysAheadChange(d)}
              transition="all 0.15s"
            >
              {d}d
            </Box>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
};
