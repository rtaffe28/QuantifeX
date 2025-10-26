import React, { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import { Input, Box, Spinner } from "@chakra-ui/react";
import { List, type RowComponentProps } from "react-window";
import tickerService from "@/api/ticker";
import debounce from "lodash.debounce";

interface Item {
  name: string;
  symbol: string;
}

function RowComponent({
  index,
  results,
  style,
}: RowComponentProps<{ results: Item[] }>) {
  const item = results[index];
  const maxNameLength = 31;
  const displayName =
    item.name.length > maxNameLength
      ? item.name.slice(0, maxNameLength) + "..."
      : item.name;
  return (
    <Box
      key={item.symbol}
      color="black"
      font="lg"
      px={3}
      py={2}
      _hover={{ bg: "gray.100" }}
      onClick={() => {
        alert(`You clicked ${item.symbol}`);
      }}
      style={style}
      cursor="pointer"
    >
      <b>{item.symbol}</b> — {displayName}
    </Box>
  );
}

export const Autocomplete: React.FC = () => {
  const [data, setData] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await tickerService.getTickers();
      setData(res.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(data, {
        keys: ["name", "symbol"],
        threshold: 0.3,
      }),
    [data]
  );

  useEffect(() => {
    const debouncedSearch = debounce((q: string) => {
      if (!q) {
        setResults([]);
      } else {
        const found = fuse.search(q, { limit: 50 }).map((r) => r.item);
        setResults(found);
      }
    }, 300);

    debouncedSearch(query);

    return () => {
      debouncedSearch.cancel();
    };
  }, [query, fuse]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  return (
    <Box width="400px">
      <Input
        placeholder="Search ticker..."
        value={query}
        onChange={handleChange}
        disabled={loading}
      />

      {loading && (
        <Box mt={2} textAlign="center">
          <Spinner size="sm" />
        </Box>
      )}

      {query && results.length > 0 && (
        <Box
          borderWidth="1px"
          borderRadius="md"
          maxH="300px"
          overflow="hidden"
          mt={2}
          bg="white"
          boxShadow="lg"
        >
          <List
            rowComponent={RowComponent}
            rowCount={results.length}
            rowHeight={35}
            rowProps={{ results }}
          />
        </Box>
      )}

      {query && results.length === 0 && !loading && (
        <Box
          borderWidth="1px"
          borderRadius="md"
          maxH="300px"
          overflow="hidden"
          mt={2}
          bg="white"
          boxShadow="lg"
          textAlign="center"
          py={4}
          color="gray.500"
        >
          No results found
        </Box>
      )}
    </Box>
  );
};
