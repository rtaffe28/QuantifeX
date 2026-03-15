import React from "react";
import { Box, Text } from "@chakra-ui/react";
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
import type { EarningsReport } from "@/models/StockDetail";

interface EarningsChartProps {
  earnings: EarningsReport[];
}

const CustomTooltip = (props: any) => (
  <Box bg="bg.panel" p={2} borderRadius="md" boxShadow="md">
    <Chart.Tooltip {...props} />
  </Box>
);

export const EarningsChart: React.FC<EarningsChartProps> = ({ earnings }) => {
  const chart = useChart({
    data: earnings,
    series: [
      { name: "actual_eps", color: "green.solid", label: "Actual EPS" },
      { name: "estimated_eps", color: "gray.solid", label: "Estimated EPS" },
    ],
  });

  if (earnings.length === 0) {
    return null;
  }

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={3}>
        Quarterly Earnings
      </Text>
      <Chart.Root maxH="xs" chart={chart}>
        <BarChart data={chart.data}>
          <CartesianGrid
            stroke={chart.color("border.muted")}
            vertical={false}
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey={chart.key("quarter")}
          />
          <YAxis axisLine={false} tickLine={false} />
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
