import React, { useState } from "react";
import {
  Box,
  Text,
  VStack,
  Input,
  Button,
  RadioGroup,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import type { StrategyDefinition } from "@/models/Backtest";

interface BacktestConfigFormProps {
  strategies: StrategyDefinition[];
  onSubmit: (payload: {
    ticker: string;
    strategy: string;
    parameters: Record<string, number>;
    start_date: string;
    end_date: string;
    initial_capital: number;
  }) => void;
  loading: boolean;
}

export const BacktestConfigForm: React.FC<BacktestConfigFormProps> = ({
  strategies,
  onSubmit,
  loading,
}) => {
  const [ticker, setTicker] = useState("");
  const [strategy, setStrategy] = useState(strategies[0]?.id ?? "buy_and_hold");
  const [startDate, setStartDate] = useState("2022-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [capital, setCapital] = useState(10000);
  const [params, setParams] = useState<Record<string, number>>({});

  const selectedStrategy = strategies.find((s) => s.id === strategy);

  const handleParamChange = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleSubmit = () => {
    if (!ticker.trim()) return;
    const finalParams: Record<string, number> = {};
    selectedStrategy?.parameters.forEach((p) => {
      finalParams[p.key] = params[p.key] ?? (p.default as number);
    });
    onSubmit({
      ticker: ticker.trim().toUpperCase(),
      strategy,
      parameters: finalParams,
      start_date: startDate,
      end_date: endDate,
      initial_capital: capital,
    });
  };

  return (
    <VStack align="stretch" gap={4}>
      <Box>
        <Text fontSize="xs" fontWeight={700} textTransform="uppercase" letterSpacing="wider" color="fg.muted" mb={1}>
          Ticker
        </Text>
        <Input
          placeholder="e.g. AAPL"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          size="sm"
        />
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight={700} textTransform="uppercase" letterSpacing="wider" color="fg.muted" mb={2}>
          Strategy
        </Text>
        <RadioGroup.Root
          value={strategy}
          onValueChange={(e) => {
            setStrategy(e.value);
            setParams({});
          }}
        >
          <VStack align="stretch" gap={1}>
            {strategies.map((s) => (
              <RadioGroup.Item key={s.id} value={s.id}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>
                  <Text fontSize="sm" fontWeight={500}>{s.name}</Text>
                  <Text fontSize="xs" color="fg.muted">{s.description}</Text>
                </RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </VStack>
        </RadioGroup.Root>
      </Box>

      {selectedStrategy && selectedStrategy.parameters.length > 0 && (
        <Box>
          <Text fontSize="xs" fontWeight={700} textTransform="uppercase" letterSpacing="wider" color="fg.muted" mb={2}>
            Parameters
          </Text>
          <VStack align="stretch" gap={2}>
            {selectedStrategy.parameters.map((p) => (
              <Box key={p.key}>
                <Text fontSize="xs" color="fg.muted" mb={1}>{p.label}</Text>
                <Input
                  size="sm"
                  type="number"
                  defaultValue={String(p.default)}
                  onChange={(e) => handleParamChange(p.key, e.target.value)}
                />
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      <Box>
        <Text fontSize="xs" fontWeight={700} textTransform="uppercase" letterSpacing="wider" color="fg.muted" mb={2}>
          Date Range
        </Text>
        <Flex gap={2}>
          <Box flex={1}>
            <Text fontSize="xs" color="fg.muted" mb={1}>Start</Text>
            <Input size="sm" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Box>
          <Box flex={1}>
            <Text fontSize="xs" color="fg.muted" mb={1}>End</Text>
            <Input size="sm" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Box>
        </Flex>
      </Box>

      <Box>
        <Text fontSize="xs" fontWeight={700} textTransform="uppercase" letterSpacing="wider" color="fg.muted" mb={1}>
          Initial Capital ($)
        </Text>
        <Input
          size="sm"
          type="number"
          value={capital}
          onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
        />
      </Box>

      <Button
        colorPalette="teal"
        size="sm"
        onClick={handleSubmit}
        disabled={!ticker.trim() || loading}
      >
        {loading ? <Spinner size="sm" /> : "Run Backtest"}
      </Button>
    </VStack>
  );
};
