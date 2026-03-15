import React, { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import { Input, Box, Text, Flex, Spinner, IconButton } from "@chakra-ui/react";
import { List, type RowComponentProps } from "react-window";
import debounce from "lodash.debounce";
import type { WatchlistItem } from "@/models/WatchlistItem";

interface TickerItem {
  name: string;
  symbol: string;
}

interface WatchlistSidebarProps {
  watchlist: WatchlistItem[];
  selectedTicker: string | null;
  onSelectTicker: (symbol: string) => void;
  onAddTicker: (symbol: string) => void;
  onRemoveTicker: (id: number) => void;
  allTickers: TickerItem[];
  tickersLoading: boolean;
}

function SearchRow({
  index,
  results,
  onAdd,
  style,
}: RowComponentProps<{ results: TickerItem[]; onAdd: (s: string) => void }>) {
  const item = results[index];
  const maxNameLength = 25;
  const displayName =
    item.name.length > maxNameLength
      ? item.name.slice(0, maxNameLength) + "..."
      : item.name;
  return (
    <Box
      key={item.symbol}
      color="fg.default"
      fontSize="sm"
      px={3}
      py={2}
      _hover={{ bg: "bg.muted" }}
      onClick={() => onAdd(item.symbol)}
      style={style}
      cursor="pointer"
    >
      <b>{item.symbol}</b> — {displayName}
    </Box>
  );
}

export const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({
  watchlist,
  selectedTicker,
  onSelectTicker,
  onAddTicker,
  onRemoveTicker,
  allTickers,
  tickersLoading,
}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TickerItem[]>([]);

  const fuse = useMemo(
    () =>
      new Fuse(allTickers, {
        keys: ["name", "symbol"],
        threshold: 0.3,
      }),
    [allTickers]
  );

  useEffect(() => {
    const debouncedSearch = debounce((q: string) => {
      if (!q) {
        setSearchResults([]);
      } else {
        const found = fuse.search(q, { limit: 50 }).map((r) => r.item);
        setSearchResults(found);
      }
    }, 300);

    debouncedSearch(query);

    return () => {
      debouncedSearch.cancel();
    };
  }, [query, fuse]);

  const handleAdd = (symbol: string) => {
    onAddTicker(symbol);
    setQuery("");
    setSearchResults([]);
  };

  return (
    <Box h="100%" display="flex" flexDirection="column">
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={3}>
        Watchlist
      </Text>

      {/* Search */}
      <Box position="relative" mb={3}>
        <Input
          placeholder="Search ticker to add..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={tickersLoading}
          size="sm"
        />

        {tickersLoading && (
          <Box mt={2} textAlign="center">
            <Spinner size="sm" />
          </Box>
        )}

        {query && searchResults.length > 0 && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            zIndex={10}
            borderWidth="1px"
            borderRadius="md"
            maxH="250px"
            overflow="hidden"
            mt={1}
            bg="bg.subtle"
            boxShadow="lg"
          >
            <List
              rowComponent={SearchRow}
              rowCount={searchResults.length}
              rowHeight={35}
              rowProps={{ results: searchResults, onAdd: handleAdd }}
            />
          </Box>
        )}

        {query && searchResults.length === 0 && !tickersLoading && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            zIndex={10}
            borderWidth="1px"
            borderRadius="md"
            mt={1}
            bg="bg.subtle"
            boxShadow="lg"
            textAlign="center"
            py={3}
          >
            <Text fontSize="sm" color="fg.muted">
              No results found
            </Text>
          </Box>
        )}
      </Box>

      {/* Watchlist Items */}
      <Box flex={1} overflowY="auto">
        {watchlist.length === 0 && (
          <Text fontSize="sm" color="fg.muted" textAlign="center" mt={4}>
            Your watchlist is empty. Search for a ticker above to add one.
          </Text>
        )}
        {watchlist.map((item) => (
          <Flex
            key={item.id}
            align="center"
            justify="space-between"
            px={3}
            py={2}
            borderRadius="md"
            cursor="pointer"
            bg={selectedTicker === item.ticker ? "bg.muted" : "transparent"}
            _hover={{ bg: "bg.muted" }}
            onClick={() => onSelectTicker(item.ticker)}
          >
            <Text
              fontSize="sm"
              fontWeight={selectedTicker === item.ticker ? "bold" : "normal"}
              color="fg.default"
            >
              {item.ticker}
            </Text>
            <IconButton
              aria-label={`Remove ${item.ticker}`}
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTicker(item.id);
              }}
            >
              ✕
            </IconButton>
          </Flex>
        ))}
      </Box>
    </Box>
  );
};
