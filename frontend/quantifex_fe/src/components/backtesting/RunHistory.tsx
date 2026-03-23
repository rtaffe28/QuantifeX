import React from "react";
import { Box, Text, VStack, Flex, Badge, IconButton } from "@chakra-ui/react";
import { FiTrash2, FiEye } from "react-icons/fi";
import type { BacktestRun } from "@/models/Backtest";

interface RunHistoryProps {
  runs: BacktestRun[];
  activeRunId: number | null;
  onView: (run: BacktestRun) => void;
  onDelete: (id: number) => void;
}

const STATUS_COLOR: Record<string, string> = {
  complete: "green",
  running: "blue",
  pending: "yellow",
  failed: "red",
};

export const RunHistory: React.FC<RunHistoryProps> = ({ runs, activeRunId, onView, onDelete }) => {
  if (!runs.length) return null;

  return (
    <Box mt={6}>
      <Text fontSize="xs" fontWeight={700} textTransform="uppercase" letterSpacing="wider" color="fg.muted" mb={2}>
        Run History
      </Text>
      <VStack align="stretch" gap={1} maxH="200px" overflowY="auto">
        {runs.map((run) => (
          <Flex
            key={run.id}
            align="center"
            justify="space-between"
            px={2}
            py={1}
            borderRadius="md"
            bg={activeRunId === run.id ? "bg.muted" : "transparent"}
            _hover={{ bg: "bg.subtle" }}
            borderWidth="1px"
            borderColor="border.default"
          >
            <Box flex={1} minW={0}>
              <Text fontSize="xs" fontWeight={600} truncate>
                {run.ticker} / {run.strategy.replace(/_/g, " ")}
              </Text>
              <Flex align="center" gap={2} mt={0.5}>
                <Badge colorPalette={STATUS_COLOR[run.status]} size="sm">
                  {run.status}
                </Badge>
                <Text fontSize="xs" color="fg.muted">
                  {new Date(run.created_at).toLocaleDateString()}
                </Text>
              </Flex>
            </Box>
            <Flex gap={1}>
              {run.status === "complete" && (
                <IconButton
                  aria-label="View run"
                  size="xs"
                  variant="ghost"
                  onClick={() => onView(run)}
                >
                  <FiEye />
                </IconButton>
              )}
              <IconButton
                aria-label="Delete run"
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={() => onDelete(run.id)}
              >
                <FiTrash2 />
              </IconButton>
            </Flex>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
};
