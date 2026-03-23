import React from "react";
import { Box, Text } from "@chakra-ui/react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { MonteCarloResult } from "@/models/MonteCarlo";
import { toUSD } from "@/lib/formatters";

interface FanChartProps {
  result: MonteCarloResult;
}

const fmtY = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <Box bg="gray.900" color="gray.100" p={3} borderRadius="md" boxShadow="lg" fontSize="xs" minW="160px">
      <Text fontWeight="bold" mb={2}>{label}</Text>
      {[
        { label: "90th pct", key: "p90", color: "#2dd4bf" },
        { label: "75th pct", key: "p75", color: "#5eead4" },
        { label: "Median",   key: "p50", color: "#14b8a6" },
        { label: "25th pct", key: "p25", color: "#fb923c" },
        { label: "10th pct", key: "p10", color: "#f87171" },
      ].map(({ label, key, color }) => (
        <Flex key={key} justify="space-between" gap={4}>
          <Text color={color}>{label}</Text>
          <Text>{toUSD(d[key])}</Text>
        </Flex>
      ))}
    </Box>
  );
};

// Chakra Flex isn't available here since we're in a recharts tooltip — use a div
const Flex = ({ children, justify, gap }: any) => (
  <div style={{ display: "flex", justifyContent: justify, gap: `${gap * 4}px` }}>{children}</div>
);

export const FanChart: React.FC<FanChartProps> = ({ result }) => {
  const { percentiles, time_labels, initial_value } = result;

  const data = time_labels.map((label, i) => ({
    label,
    // Stacked bands (each is the delta above the previous band)
    p10_base:    percentiles.p10[i],
    band_10_25:  percentiles.p25[i] - percentiles.p10[i],
    band_25_50:  percentiles.p50[i] - percentiles.p25[i],
    band_50_75:  percentiles.p75[i] - percentiles.p50[i],
    band_75_90:  percentiles.p90[i] - percentiles.p75[i],
    // Raw values for tooltip and median line
    p10: percentiles.p10[i],
    p25: percentiles.p25[i],
    p50: percentiles.p50[i],
    p75: percentiles.p75[i],
    p90: percentiles.p90[i],
  }));

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={3}>
        Projected Portfolio Value
      </Text>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(result.years / 5)}
          />
          <YAxis
            tickFormatter={fmtY}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
          <ReferenceLine y={initial_value} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />

          {/* Invisible base to start bands at p10 */}
          <Area dataKey="p10_base" stackId="fan" fill="transparent" stroke="none" isAnimationActive={false} />
          {/* P10–P25: light red */}
          <Area dataKey="band_10_25" stackId="fan" fill="rgba(248,113,113,0.18)" stroke="none" isAnimationActive={false} />
          {/* P25–P50: light orange */}
          <Area dataKey="band_25_50" stackId="fan" fill="rgba(251,146,60,0.18)" stroke="none" isAnimationActive={false} />
          {/* P50–P75: light teal */}
          <Area dataKey="band_50_75" stackId="fan" fill="rgba(94,234,212,0.18)" stroke="none" isAnimationActive={false} />
          {/* P75–P90: lighter teal */}
          <Area dataKey="band_75_90" stackId="fan" fill="rgba(94,234,212,0.10)" stroke="none" isAnimationActive={false} />

          {/* Median line on top */}
          <Line
            dataKey="p50"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <Box display="flex" gap={4} mt={2} justifyContent="center" flexWrap="wrap">
        {[
          { color: "rgba(94,234,212,0.3)", label: "P75–P90" },
          { color: "rgba(94,234,212,0.5)", label: "P50–P75" },
          { color: "#14b8a6", label: "Median", line: true },
          { color: "rgba(251,146,60,0.5)", label: "P25–P50" },
          { color: "rgba(248,113,113,0.4)", label: "P10–P25" },
        ].map(({ color, label, line }) => (
          <Box key={label} display="flex" alignItems="center" gap={1}>
            <Box
              w={line ? "24px" : "12px"}
              h={line ? "2px" : "10px"}
              bg={color}
              borderRadius={line ? "0" : "2px"}
            />
            <Text fontSize="xs" color="fg.muted">{label}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
