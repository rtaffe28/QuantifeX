import React from "react";
import { Box, Text, Flex, Button } from "@chakra-ui/react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "@/models/StockDetail";
import { toUSD } from "@/lib/formatters";

export type TimeRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

interface PriceHistoryChartProps {
  priceHistory: PricePoint[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const CustomTooltip = (props: any) => (
  <Box bg="bg.panel" p={2} borderRadius="md" boxShadow="md">
    <Chart.Tooltip {...props} />
  </Box>
);

const TIME_RANGES: TimeRange[] = ["1M", "3M", "6M", "1Y", "ALL"];

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  priceHistory,
  timeRange,
  onTimeRangeChange,
}) => {
  const chart = useChart({
    data: priceHistory,
    series: [{ name: "close", color: "teal.solid" }],
  });

  return (
    <Box mb={6}>
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="fg.default">
          Price History
        </Text>
        <Flex gap={1}>
          {TIME_RANGES.map((range) => (
            <Button
              key={range}
              size="xs"
              variant={timeRange === range ? "solid" : "outline"}
              colorPalette="teal"
              onClick={() => onTimeRangeChange(range)}
            >
              {range}
            </Button>
          ))}
        </Flex>
      </Flex>
      <Chart.Root maxH="xs" chart={chart}>
        <AreaChart data={chart.data}>
          <CartesianGrid
            stroke={chart.color("border.muted")}
            vertical={false}
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey={chart.key("date")}
            tickFormatter={(value) => {
              const d = new Date(value);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={toUSD}
            domain={["auto", "auto"]}
          />
          <Tooltip
            cursor={false}
            animationDuration={100}
            content={<CustomTooltip />}
            formatter={(value: number) => toUSD(value)}
          />
          {chart.series.map((item) => (
            <Area
              key={item.name}
              isAnimationActive={false}
              dataKey={chart.key(item.name)}
              fill={chart.color(item.color)}
              fillOpacity={0.2}
              stroke={chart.color(item.color)}
            />
          ))}
        </AreaChart>
      </Chart.Root>
    </Box>
  );
};
