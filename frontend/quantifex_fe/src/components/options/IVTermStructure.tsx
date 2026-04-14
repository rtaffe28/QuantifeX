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
} from "recharts";
import type { TermStructurePoint } from "@/models/OptionsData";

interface IVTermStructureProps {
  termStructure: TermStructurePoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as TermStructurePoint | undefined;
  return (
    <Box bg="gray.900" color="gray.100" p={2} borderRadius="md" boxShadow="lg" fontSize="sm">
      <Text fontWeight="bold" mb={1}>{label}</Text>
      {point && (
        <>
          <Text>ATM IV: {point.atm_iv}%</Text>
          <Text>{point.dte} DTE</Text>
        </>
      )}
    </Box>
  );
};

export const IVTermStructure: React.FC<IVTermStructureProps> = ({
  termStructure,
}) => {
  const chart = useChart({
    data: termStructure,
    series: [{ name: "atm_iv", color: "teal.solid" }],
  });

  if (termStructure.length < 2) return null;

  const isContango =
    termStructure.length >= 2 &&
    termStructure[termStructure.length - 1].atm_iv > termStructure[0].atm_iv;

  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="fg.default" mb={1}>
        IV Term Structure
      </Text>
      <Text fontSize="xs" color="fg.muted" mb={3}>
        ATM implied volatility across expirations.{" "}
        {isContango
          ? "Contango — longer-dated options are priced with higher IV."
          : "Backwardation — near-term options are priced with higher IV (potential event risk)."}
      </Text>
      <Chart.Root maxH="2xs" chart={chart}>
        <LineChart data={chart.data}>
          <CartesianGrid
            stroke={chart.color("border.muted")}
            vertical={false}
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey="expiration"
            tickFormatter={(v) => {
              const d = new Date(v + "T00:00:00");
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
          <Line
            type="monotone"
            dataKey="atm_iv"
            stroke={chart.color("teal.solid")}
            strokeWidth={2}
            dot={{ r: 4, fill: chart.color("teal.solid") }}
            isAnimationActive={false}
          />
        </LineChart>
      </Chart.Root>
    </Box>
  );
};
