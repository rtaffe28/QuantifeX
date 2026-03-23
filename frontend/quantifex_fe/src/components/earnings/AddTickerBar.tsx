import React, { useState } from "react";
import { Box, Flex, Input, Text, Badge, Button } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";

interface Props {
  watchlistTickers: string[];
  extraTickers: string[];
  onAddTicker: (ticker: string) => void;
  onRemoveTicker: (ticker: string) => void;
  onResetToWatchlist: () => void;
}

export const AddTickerBar: React.FC<Props> = ({
  watchlistTickers,
  extraTickers,
  onAddTicker,
  onRemoveTicker,
  onResetToWatchlist,
}) => {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      const ticker = input.trim().toUpperCase();
      if (!watchlistTickers.includes(ticker) && !extraTickers.includes(ticker)) {
        onAddTicker(ticker);
      }
      setInput("");
    }
  };

  return (
    <Box mb={4}>
      <Flex align="center" flexWrap="wrap" gap={2} mb={2}>
        {/* Watchlist tickers — not removable */}
        {watchlistTickers.map((t) => (
          <Badge key={t} colorPalette="teal" variant="subtle" px={2} py={1} fontSize="xs">
            {t}
          </Badge>
        ))}
        {/* Extra tickers — removable */}
        {extraTickers.map((t) => (
          <Flex
            key={t}
            align="center"
            gap={1}
            bg="bg.muted"
            border="1px solid"
            borderColor="border.default"
            borderRadius="md"
            px={2}
            py={0.5}
          >
            <Text fontSize="xs" fontWeight={600}>{t}</Text>
            <Box
              as="button"
              cursor="pointer"
              color="fg.muted"
              _hover={{ color: "fg.default" }}
              onClick={() => onRemoveTicker(t)}
            >
              <FiX size={12} />
            </Box>
          </Flex>
        ))}
        <Input
          placeholder="Add ticker..."
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          size="sm"
          w="120px"
          variant="outline"
        />
      </Flex>
      {extraTickers.length > 0 && (
        <Button size="xs" variant="ghost" onClick={onResetToWatchlist} color="fg.muted">
          Reset to Watchlist
        </Button>
      )}
    </Box>
  );
};
