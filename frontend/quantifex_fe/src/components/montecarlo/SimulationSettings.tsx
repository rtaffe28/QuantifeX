import React from "react";
import { Box, Text, Input, Flex, Button, VStack } from "@chakra-ui/react";

interface SimulationSettingsProps {
  initialValue: number;
  monthlyContribution: number;
  years: number;
  simulations: number;
  historicalPeriod: string;
  onChange: (field: string, value: number | string) => void;
}

const SIM_OPTIONS = [100, 500, 1000, 5000];
const PERIOD_OPTIONS = ["3y", "5y", "10y", "max"];
const PERIOD_LABELS: Record<string, string> = { "3y": "3Y", "5y": "5Y", "10y": "10Y", "max": "MAX" };

export const SimulationSettings: React.FC<SimulationSettingsProps> = ({
  initialValue,
  monthlyContribution,
  years,
  simulations,
  historicalPeriod,
  onChange,
}) => (
  <VStack align="stretch" gap={3}>
    <Box>
      <Text fontSize="xs" color="fg.muted" mb={1}>Initial Value ($)</Text>
      <Input
        size="sm"
        type="number"
        value={initialValue}
        onChange={(e) => onChange("initialValue", parseFloat(e.target.value) || 0)}
      />
    </Box>

    <Box>
      <Text fontSize="xs" color="fg.muted" mb={1}>Monthly Contribution ($)</Text>
      <Input
        size="sm"
        type="number"
        min={0}
        value={monthlyContribution}
        onChange={(e) => onChange("monthlyContribution", parseFloat(e.target.value) || 0)}
      />
    </Box>

    <Box>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="xs" color="fg.muted">Time Horizon</Text>
        <Text fontSize="xs" fontWeight={600} color="fg.default">{years} years</Text>
      </Flex>
      <input
        type="range"
        min={1}
        max={50}
        value={years}
        onChange={(e) => onChange("years", parseInt(e.target.value))}
        style={{ width: "100%", accentColor: "var(--chakra-colors-teal-500)" }}
      />
      <Flex justify="space-between">
        <Text fontSize="xs" color="fg.muted">1</Text>
        <Text fontSize="xs" color="fg.muted">50</Text>
      </Flex>
    </Box>

    <Box>
      <Text fontSize="xs" color="fg.muted" mb={1}>Simulations</Text>
      <Flex gap={1}>
        {SIM_OPTIONS.map((n) => (
          <Button
            key={n}
            size="xs"
            flex={1}
            variant={simulations === n ? "solid" : "outline"}
            colorPalette="teal"
            onClick={() => onChange("simulations", n)}
          >
            {n >= 1000 ? `${n / 1000}k` : n}
          </Button>
        ))}
      </Flex>
    </Box>

    <Box>
      <Text fontSize="xs" color="fg.muted" mb={1}>Historical Period</Text>
      <Flex gap={1}>
        {PERIOD_OPTIONS.map((p) => (
          <Button
            key={p}
            size="xs"
            flex={1}
            variant={historicalPeriod === p ? "solid" : "outline"}
            colorPalette="teal"
            onClick={() => onChange("historicalPeriod", p)}
          >
            {PERIOD_LABELS[p]}
          </Button>
        ))}
      </Flex>
    </Box>
  </VStack>
);
