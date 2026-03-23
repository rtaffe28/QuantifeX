import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { Chart, useChart } from "@chakra-ui/charts";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { EquityPoint } from "@/models/Backtest";
import { toUSD } from "@/lib/formatters";

interface EquityCurveChartProps {
  equityCurve: EquityPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Box bg="gray.900" color="gray.100" p={2} borderRadius="md" boxShadow="lg" fontSize="sm">
      <Text fontWeight="bold" mb={1}>{label}</Text>
      <Text>{toUSD(payload[0].value)}</Text>
    </Box>
  );
};

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ equityCurve }) => {
  const chart = useChart({
    data: equityCurve,
    series: [{ name: "value", color: "teal.solid" }],
  });

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={3}>
        Equity Curve
      </Text>
      <Chart.Root maxH="xs" chart={chart}>
        <AreaChart data={chart.data}>
          <CartesianGrid stroke={chart.color("border.muted")} vertical={false} />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey={chart.key("date")}
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
            }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            domain={["auto", "auto"]}
          />
          <Tooltip cursor={false} animationDuration={100} content={<CustomTooltip />} />
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
