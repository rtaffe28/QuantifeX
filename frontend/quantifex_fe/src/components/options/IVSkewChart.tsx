import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Line,
  LineChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import type { IVSkew } from "@/models/OptionsData";
import { toUSD } from "@/lib/formatters";

interface IVSkewChartProps {
  skew: IVSkew;
  currentPrice: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Box bg="gray.900" color="gray.100" p={2} borderRadius="md" boxShadow="lg" fontSize="sm">
      <Text fontWeight="bold" mb={1}>Strike: {toUSD(Number(label))}</Text>
      {payload.map((entry: any) => (
        <Text key={entry.name} color={entry.color}>
          {entry.name === "callIV" ? "Call" : "Put"} IV: {entry.value}%
        </Text>
      ))}
    </Box>
  );
};

export const IVSkewChart: React.FC<IVSkewChartProps> = ({
  skew,
  currentPrice,
}) => {
  // Merge calls and puts by strike into a single dataset
  const merged = new Map<number, { strike: number; callIV?: number; putIV?: number }>();

  for (const c of skew.calls) {
    const entry = merged.get(c.strike) || { strike: c.strike };
    entry.callIV = c.iv;
    merged.set(c.strike, entry);
  }
  for (const p of skew.puts) {
    const entry = merged.get(p.strike) || { strike: p.strike };
    entry.putIV = p.iv;
    merged.set(p.strike, entry);
  }

  const data = Array.from(merged.values()).sort((a, b) => a.strike - b.strike);

  const chart = useChart({
    data,
    series: [
      { name: "callIV", color: "teal.solid" },
      { name: "putIV", color: "purple.solid" },
    ],
  });

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={3}>
        IV Skew
      </Text>
      <Chart.Root maxH="xs" chart={chart}>
        <LineChart data={chart.data}>
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
            tickFormatter={(v) => `${v}%`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            animationDuration={100}
            content={<CustomTooltip />}
          />
          <ReferenceLine
            x={currentPrice}
            stroke={chart.color("fg.muted")}
            strokeDasharray="3 3"
            label={{ value: "ATM", fill: chart.color("fg.muted"), fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="callIV"
            stroke={chart.color("teal.solid")}
            dot={false}
            name="callIV"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="putIV"
            stroke={chart.color("purple.solid")}
            dot={false}
            name="putIV"
            isAnimationActive={false}
          />
        </LineChart>
      </Chart.Root>
      <Text fontSize="xs" color="fg.muted" mt={1}>
        Teal = Calls, Purple = Puts. Dashed line = current price.
      </Text>
    </Box>
  );
};
