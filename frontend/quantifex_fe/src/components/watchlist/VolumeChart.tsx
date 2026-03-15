import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "@/models/StockDetail";
import { formatLargeNumber } from "@/lib/formatters";

interface VolumeChartProps {
  priceHistory: PricePoint[];
}

const CustomTooltip = (props: any) => (
  <Box bg="bg.panel" p={2} borderRadius="md" boxShadow="md">
    <Chart.Tooltip {...props} />
  </Box>
);

export const VolumeChart: React.FC<VolumeChartProps> = ({ priceHistory }) => {
  const chart = useChart({
    data: priceHistory,
    series: [{ name: "volume", color: "teal.solid" }],
  });

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={3}>
        Volume
      </Text>
      <Chart.Root maxH="2xs" chart={chart}>
        <BarChart data={chart.data}>
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
            tickFormatter={formatLargeNumber}
          />
          <Tooltip
            cursor={false}
            animationDuration={100}
            content={<CustomTooltip />}
            formatter={(value: number) => formatLargeNumber(value)}
          />
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
