import React from "react";
import { Box, Text, SimpleGrid, Flex } from "@chakra-ui/react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import type { IVRV } from "@/models/OptionsData";

interface IVvsRVChartProps {
  ivRv: IVRV;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Box bg="gray.900" color="gray.100" p={2} borderRadius="md" boxShadow="lg" fontSize="sm">
      <Text fontWeight="bold" mb={1}>{label}</Text>
      {payload.map((entry: any) => (
        <Text key={entry.name} color={entry.color}>
          RV (30d): {entry.value.toFixed(1)}%
        </Text>
      ))}
    </Box>
  );
};

export const IVvsRVChart: React.FC<IVvsRVChartProps> = ({ ivRv }) => {
  const { atm_iv, rv_windows, rv_series } = ivRv;

  const chart = useChart({
    data: rv_series,
    series: [{ name: "rv", color: "purple.solid" }],
  });

  const latestRV30 = rv_windows.find((w) => w.window === "30d")?.rv;
  const ivPremium =
    atm_iv != null && latestRV30 != null
      ? (atm_iv - latestRV30).toFixed(1)
      : null;

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={1}>
        Implied vs Realized Volatility
      </Text>
      <Text fontSize="xs" color="fg.muted" mb={3}>
        {ivPremium != null
          ? Number(ivPremium) > 0
            ? `IV is ${ivPremium}pp above RV — options are relatively expensive (sellers favored).`
            : `IV is ${Math.abs(Number(ivPremium)).toFixed(1)}pp below RV — options are relatively cheap (buyers favored).`
          : "Comparing current implied volatility against historical realized volatility."}
      </Text>

      {/* RV Windows summary */}
      <SimpleGrid columns={rv_windows.length} gap={3} mb={4}>
        {rv_windows.map((w) => (
          <Box key={w.window} p={3} bg="bg.muted" borderRadius="md">
            <Text fontSize="xs" color="fg.muted" mb={1}>
              RV ({w.window})
            </Text>
            <Text fontSize="sm" fontWeight="bold" color="fg.default">
              {w.rv.toFixed(1)}%
            </Text>
          </Box>
        ))}
      </SimpleGrid>

      {/* RV time series with ATM IV reference line */}
      {rv_series.length > 0 && (
        <Chart.Root maxH="2xs" chart={chart}>
          <AreaChart data={chart.data}>
            <CartesianGrid
              stroke={chart.color("border.muted")}
              vertical={false}
            />
            <XAxis
              axisLine={false}
              tickLine={false}
              dataKey="date"
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
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
            {atm_iv != null && (
              <ReferenceLine
                y={atm_iv}
                stroke={chart.color("teal.solid")}
                strokeDasharray="5 5"
                label={{
                  value: `ATM IV ${atm_iv}%`,
                  fill: chart.color("teal.solid"),
                  fontSize: 11,
                  position: "right",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="rv"
              stroke={chart.color("purple.solid")}
              fill={chart.color("purple.solid")}
              fillOpacity={0.15}
              isAnimationActive={false}
            />
          </AreaChart>
        </Chart.Root>
      )}
      <Flex mt={1} gap={4}>
        <Text fontSize="xs" color="fg.muted">
          Purple area = Rolling 30d Realized Vol
        </Text>
        {atm_iv != null && (
          <Text fontSize="xs" color="fg.muted">
            Teal dashed = Current ATM Implied Vol
          </Text>
        )}
      </Flex>
    </Box>
  );
};
