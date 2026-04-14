import React, { useState, useMemo } from "react";
import { Box, Text, Flex, Button, Table } from "@chakra-ui/react";
import type { OptionContract } from "@/models/OptionsData";
import { toUSD } from "@/lib/formatters";

interface OptionsChainTableProps {
  calls: OptionContract[];
  puts: OptionContract[];
  currentPrice: number;
}

type ChainView = "calls" | "puts" | "straddle";

export const OptionsChainTable: React.FC<OptionsChainTableProps> = ({
  calls,
  puts,
  currentPrice,
}) => {
  const [view, setView] = useState<ChainView>("calls");

  const filteredCalls = useMemo(
    () => calls.filter((c) => c.strike && c.volume + c.openInterest > 0),
    [calls]
  );
  const filteredPuts = useMemo(
    () => puts.filter((p) => p.strike && p.volume + p.openInterest > 0),
    [puts]
  );

  const straddleData = useMemo(() => {
    const putMap = new Map(filteredPuts.map((p) => [p.strike, p]));
    return filteredCalls
      .filter((c) => putMap.has(c.strike))
      .map((c) => ({
        strike: c.strike!,
        call: c,
        put: putMap.get(c.strike)!,
      }));
  }, [filteredCalls, filteredPuts]);

  const renderContracts = (contracts: OptionContract[]) => (
    <Table.Root size="sm" variant="outline">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Strike</Table.ColumnHeader>
          <Table.ColumnHeader>Last</Table.ColumnHeader>
          <Table.ColumnHeader>Bid</Table.ColumnHeader>
          <Table.ColumnHeader>Ask</Table.ColumnHeader>
          <Table.ColumnHeader>Change</Table.ColumnHeader>
          <Table.ColumnHeader>Vol</Table.ColumnHeader>
          <Table.ColumnHeader>OI</Table.ColumnHeader>
          <Table.ColumnHeader>IV</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {contracts.map((c, i) => {
          const isATM =
            c.strike != null &&
            Math.abs(c.strike - currentPrice) / currentPrice < 0.02;
          return (
            <Table.Row
              key={i}
              bg={c.inTheMoney ? "teal.950/20" : undefined}
              fontWeight={isATM ? "bold" : "normal"}
            >
              <Table.Cell>{c.strike != null ? toUSD(c.strike) : "-"}</Table.Cell>
              <Table.Cell>{c.lastPrice != null ? toUSD(c.lastPrice) : "-"}</Table.Cell>
              <Table.Cell>{c.bid != null ? toUSD(c.bid) : "-"}</Table.Cell>
              <Table.Cell>{c.ask != null ? toUSD(c.ask) : "-"}</Table.Cell>
              <Table.Cell>
                <Text
                  as="span"
                  color={
                    c.percentChange != null && c.percentChange >= 0
                      ? "up"
                      : "down"
                  }
                >
                  {c.percentChange != null
                    ? `${c.percentChange >= 0 ? "+" : ""}${c.percentChange.toFixed(1)}%`
                    : "-"}
                </Text>
              </Table.Cell>
              <Table.Cell>{c.volume.toLocaleString()}</Table.Cell>
              <Table.Cell>{c.openInterest.toLocaleString()}</Table.Cell>
              <Table.Cell>
                {c.impliedVolatility != null
                  ? `${(c.impliedVolatility * 100).toFixed(1)}%`
                  : "-"}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );

  return (
    <Box mb={6}>
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="fg.default">
          Options Chain
        </Text>
        <Flex gap={1}>
          {(["calls", "puts", "straddle"] as ChainView[]).map((v) => (
            <Button
              key={v}
              size="xs"
              variant={view === v ? "solid" : "outline"}
              colorPalette="teal"
              onClick={() => setView(v)}
              textTransform="capitalize"
            >
              {v}
            </Button>
          ))}
        </Flex>
      </Flex>
      <Box maxH="400px" overflowY="auto">
        {view === "calls" && renderContracts(filteredCalls)}
        {view === "puts" && renderContracts(filteredPuts)}
        {view === "straddle" && (
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>C.Bid</Table.ColumnHeader>
                <Table.ColumnHeader>C.Ask</Table.ColumnHeader>
                <Table.ColumnHeader>C.Vol</Table.ColumnHeader>
                <Table.ColumnHeader>C.IV</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="extrabold">Strike</Table.ColumnHeader>
                <Table.ColumnHeader>P.IV</Table.ColumnHeader>
                <Table.ColumnHeader>P.Vol</Table.ColumnHeader>
                <Table.ColumnHeader>P.Bid</Table.ColumnHeader>
                <Table.ColumnHeader>P.Ask</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {straddleData.map((row, i) => {
                const isATM =
                  Math.abs(row.strike - currentPrice) / currentPrice < 0.02;
                return (
                  <Table.Row key={i} fontWeight={isATM ? "bold" : "normal"}>
                    <Table.Cell>
                      {row.call.bid != null ? toUSD(row.call.bid) : "-"}
                    </Table.Cell>
                    <Table.Cell>
                      {row.call.ask != null ? toUSD(row.call.ask) : "-"}
                    </Table.Cell>
                    <Table.Cell>{row.call.volume.toLocaleString()}</Table.Cell>
                    <Table.Cell>
                      {row.call.impliedVolatility != null
                        ? `${(row.call.impliedVolatility * 100).toFixed(1)}%`
                        : "-"}
                    </Table.Cell>
                    <Table.Cell fontWeight="bold">
                      {toUSD(row.strike)}
                    </Table.Cell>
                    <Table.Cell>
                      {row.put.impliedVolatility != null
                        ? `${(row.put.impliedVolatility * 100).toFixed(1)}%`
                        : "-"}
                    </Table.Cell>
                    <Table.Cell>{row.put.volume.toLocaleString()}</Table.Cell>
                    <Table.Cell>
                      {row.put.bid != null ? toUSD(row.put.bid) : "-"}
                    </Table.Cell>
                    <Table.Cell>
                      {row.put.ask != null ? toUSD(row.put.ask) : "-"}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        )}
      </Box>
    </Box>
  );
};
