import React, { useEffect, useState } from "react";
import { Box, Text, Input, Button, Flex, IconButton, VStack } from "@chakra-ui/react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import watchlistService from "@/api/watchlist";
import type { Holding } from "@/models/MonteCarlo";

interface HoldingsInputProps {
  holdings: Holding[];
  onChange: (holdings: Holding[]) => void;
}

export const HoldingsInput: React.FC<HoldingsInputProps> = ({ holdings, onChange }) => {
  const [watchlistTickers, setWatchlistTickers] = useState<string[]>([]);

  useEffect(() => {
    watchlistService.getWatchlist().then((res) => {
      setWatchlistTickers(res.data.map((w: { ticker: string }) => w.ticker));
    }).catch(() => {});
  }, []);

  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  const weightOk = Math.abs(totalWeight - 1) <= 0.015;

  const update = (index: number, field: keyof Holding, value: string) => {
    const next = holdings.map((h, i) => {
      if (i !== index) return h;
      if (field === "weight") return { ...h, weight: parseFloat(value) / 100 || 0 };
      return { ...h, [field]: value.toUpperCase() };
    });
    onChange(next);
  };

  const add = () => {
    if (holdings.length >= 15) return;
    onChange([...holdings, { ticker: "", weight: 0 }]);
  };

  const remove = (index: number) => onChange(holdings.filter((_, i) => i !== index));

  const addFromWatchlist = () => {
    if (!watchlistTickers.length) return;
    const equalWeight = parseFloat((1 / watchlistTickers.length).toFixed(4));
    const newHoldings: Holding[] = watchlistTickers.map((ticker, i) => ({
      ticker,
      weight: i === watchlistTickers.length - 1
        ? parseFloat((1 - equalWeight * (watchlistTickers.length - 1)).toFixed(4))
        : equalWeight,
    }));
    onChange(newHoldings);
  };

  const normalize = () => {
    if (!totalWeight) return;
    onChange(holdings.map((h) => ({ ...h, weight: h.weight / totalWeight })));
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="xs" fontWeight={700} textTransform="uppercase" letterSpacing="wider" color="fg.muted">
          Holdings
        </Text>
        <Flex gap={1}>
          <Button size="xs" variant="outline" onClick={addFromWatchlist} disabled={!watchlistTickers.length} color="white">
            From Watchlist
          </Button>
          <Button size="xs" variant="outline" onClick={normalize} disabled={!totalWeight} color="white">
            Normalize
          </Button>
        </Flex>
      </Flex>

      <VStack align="stretch" gap={1} mb={2}>
        {holdings.map((h, i) => (
          <Flex key={i} gap={1} align="center">
            <Input
              size="xs"
              placeholder="AAPL"
              value={h.ticker}
              onChange={(e) => update(i, "ticker", e.target.value)}
              w="70px"
              fontFamily="mono"
              textTransform="uppercase"
            />
            <Input
              size="xs"
              type="number"
              min={0}
              max={100}
              step={1}
              placeholder="0"
              value={h.weight ? parseFloat((h.weight * 100).toFixed(2)) : ""}
              onChange={(e) => update(i, "weight", e.target.value)}
              w="64px"
            />
            <Text fontSize="xs" color="fg.muted">%</Text>
            <IconButton aria-label="Remove" size="xs" variant="ghost" colorPalette="red" onClick={() => remove(i)}>
              <FiTrash2 />
            </IconButton>
          </Flex>
        ))}
      </VStack>

      <Flex justify="space-between" align="center">
        <Button size="xs" variant="ghost" onClick={add} disabled={holdings.length >= 15}>
          <FiPlus /> Add Ticker
        </Button>
        <Text
          fontSize="xs"
          fontWeight={600}
          color={weightOk ? "green.400" : "red.400"}
        >
          Total: {(totalWeight * 100).toFixed(1)}%
          {!weightOk && " (must equal 100%)"}
        </Text>
      </Flex>
    </Box>
  );
};
