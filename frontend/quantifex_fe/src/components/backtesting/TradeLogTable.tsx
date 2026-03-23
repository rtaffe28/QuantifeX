import React, { useState } from "react";
import { Box, Text, Table, Button, Flex } from "@chakra-ui/react";
import type { TradeLogEntry } from "@/models/Backtest";

interface TradeLogTableProps {
  tradeLog: TradeLogEntry[];
}

const PAGE_SIZE = 10;

export const TradeLogTable: React.FC<TradeLogTableProps> = ({ tradeLog }) => {
  const [page, setPage] = useState(0);

  if (!tradeLog.length) {
    return (
      <Box mb={6}>
        <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={3}>
          Trade Log
        </Text>
        <Text color="fg.muted" fontSize="sm">
          No trades recorded.
        </Text>
      </Box>
    );
  }

  const columns = Object.keys(tradeLog[0]);
  const totalPages = Math.ceil(tradeLog.length / PAGE_SIZE);
  const pageData = tradeLog.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const cellColor = (col: string, val: string | number | null) => {
    const key = col.toLowerCase();
    if ((key === "pnl" || key === "profit" || key === "gain") && typeof val === "number") {
      return val >= 0 ? "green.400" : "red.400";
    }
    return "fg.default";
  };

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={3}>
        Trade Log
      </Text>
      <Box overflowX="auto" borderWidth="1px" borderColor="border.default" borderRadius="md">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              {columns.map((col) => (
                <Table.ColumnHeader key={col} textTransform="capitalize" fontSize="xs" color="fg.muted">
                  {col.replace(/_/g, " ")}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {pageData.map((entry, i) => (
              <Table.Row key={i}>
                {columns.map((col) => {
                  const val = entry[col];
                  const display =
                    val == null ? "—" : typeof val === "number" ? val.toLocaleString() : String(val);
                  return (
                    <Table.Cell key={col} color={cellColor(col, val)} fontSize="xs">
                      {display}
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      {totalPages > 1 && (
        <Flex justify="space-between" align="center" mt={2}>
          <Text fontSize="xs" color="fg.muted">
            Page {page + 1} of {totalPages}
          </Text>
          <Flex gap={2}>
            <Button size="xs" variant="outline" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              Prev
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </Flex>
        </Flex>
      )}
    </Box>
  );
};
