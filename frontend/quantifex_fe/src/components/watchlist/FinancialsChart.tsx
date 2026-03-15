import React, { useState } from "react";
import { Box, Text, Flex, Button } from "@chakra-ui/react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinancialPeriod } from "@/models/StockDetail";
import { formatLargeNumber } from "@/lib/formatters";

type ViewMode = "annual" | "quarterly";

interface FinancialsChartProps {
  annual: FinancialPeriod[];
  quarterly: FinancialPeriod[];
}

const SERIES_LABELS: Record<string, string> = {
  revenue: "Revenue",
  net_income: "Net Income",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Box bg="gray.900" color="gray.100" p={2} borderRadius="md" boxShadow="lg" fontSize="sm">
      <Text fontWeight="bold" mb={1}>{label}</Text>
      {payload.map((entry: any) => (
        <Text key={entry.name}>
          {SERIES_LABELS[entry.name] || entry.name}: {formatLargeNumber(entry.value)}
        </Text>
      ))}
    </Box>
  );
};

function formatPeriodLabel(period: string, mode: ViewMode): string {
  const d = new Date(period + "T00:00:00");
  if (mode === "annual") {
    return d.getFullYear().toString();
  }
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} ${d.getFullYear()}`;
}

export const FinancialsChart: React.FC<FinancialsChartProps> = ({
  annual,
  quarterly,
}) => {
  const [view, setView] = useState<ViewMode>("annual");

  const data = (view === "annual" ? annual : quarterly).map((d) => ({
    ...d,
    label: formatPeriodLabel(d.period, view),
  }));

  const chart = useChart({
    data,
    series: [
      { name: "revenue", color: "blue.solid", label: "Revenue" },
      { name: "net_income", color: "green.solid", label: "Net Income" },
    ],
  });

  if (annual.length === 0 && quarterly.length === 0) {
    return null;
  }

  return (
    <Box mb={6}>
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="fg.default">
          Revenue & Earnings
        </Text>
        <Flex gap={1}>
          {(["annual", "quarterly"] as const).map((mode) => (
            <Button
              key={mode}
              size="xs"
              variant={view === mode ? "solid" : "outline"}
              colorPalette={view === mode ? "blue" : "gray"}
              onClick={() => setView(mode)}
            >
              {mode === "annual" ? "Annual" : "Quarterly"}
            </Button>
          ))}
        </Flex>
      </Flex>
      <Chart.Root maxH="xs" chart={chart}>
        <BarChart data={chart.data}>
          <CartesianGrid
            stroke={chart.color("border.muted")}
            vertical={false}
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey="label"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatLargeNumber(v)}
          />
          <Tooltip
            cursor={false}
            animationDuration={100}
            content={<CustomTooltip />}
          />
          <Legend content={<Chart.Legend />} />
          {chart.series.map((item) => (
            <Bar
              key={item.name}
              isAnimationActive={false}
              dataKey={chart.key(item.name)}
              fill={chart.color(item.color)}
              fillOpacity={0.8}
            />
          ))}
        </BarChart>
      </Chart.Root>
    </Box>
  );
};
