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
  ReferenceLine,
} from "recharts";
import type { VolumeOIByStrike } from "@/models/OptionsData";
import { formatLargeNumber } from "@/lib/formatters";

interface VolumeOIChartProps {
  data: VolumeOIByStrike[];
  currentPrice: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Box bg="gray.900" color="gray.100" p={2} borderRadius="md" boxShadow="lg" fontSize="sm">
      <Text fontWeight="bold" mb={1}>Strike: ${label}</Text>
      {payload.map((entry: any) => (
        <Text key={entry.name} color={entry.color}>
          {entry.name}: {formatLargeNumber(entry.value)}
        </Text>
      ))}
    </Box>
  );
};

export const VolumeOIChart: React.FC<VolumeOIChartProps> = ({
  data,
  currentPrice,
}) => {
  // Filter to strikes within 20% of current price for readability
  const filtered = data.filter(
    (d) =>
      d.strike >= currentPrice * 0.8 && d.strike <= currentPrice * 1.2
  );

  const chart = useChart({
    data: filtered,
    series: [
      { name: "callOI", color: "teal.solid" },
      { name: "putOI", color: "purple.solid" },
    ],
  });

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={1}>
        Open Interest by Strike
      </Text>
      <Text fontSize="xs" color="fg.muted" mb={3}>
        Clusters of open interest can act as support/resistance levels.
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
            dataKey="strike"
            tickFormatter={(v) => `$${v}`}
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
          />
          <ReferenceLine
            x={currentPrice}
            stroke={chart.color("fg.muted")}
            strokeDasharray="3 3"
          />
          <Bar
            dataKey="callOI"
            fill={chart.color("teal.solid")}
            fillOpacity={0.7}
            isAnimationActive={false}
            name="Call OI"
          />
          <Bar
            dataKey="putOI"
            fill={chart.color("purple.solid")}
            fillOpacity={0.7}
            isAnimationActive={false}
            name="Put OI"
          />
        </BarChart>
      </Chart.Root>
      <Text fontSize="xs" color="fg.muted" mt={1}>
        Teal = Call OI, Purple = Put OI. Dashed line = current price.
      </Text>
    </Box>
  );
};
