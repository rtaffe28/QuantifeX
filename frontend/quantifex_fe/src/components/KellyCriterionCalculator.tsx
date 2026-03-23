import React, { useState, useMemo } from "react";
import { Box, Stack, Input, Flex, Heading, Text, Grid } from "@chakra-ui/react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const toPercent = (val: number) => `${(val * 100).toFixed(2)}%`;
const toUSD = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

const CustomTooltip = (props: any) => (
  <Box bg="white" color="black" p={2} borderRadius="md" boxShadow="md">
    <Chart.Tooltip {...props} />
  </Box>
);

/**
 * Kelly Criterion: f* = (b*p - q) / b
 *   where p = win rate, q = 1 - p, b = avg win / avg loss
 *
 * Bankroll simulation uses geometric mean per trade:
 *   B_n = B_0 * (1 + f*b)^(p*n) * (1 - f)^(q*n)
 */
function kellyFraction(p: number, b: number): number {
  if (b <= 0 || p <= 0 || p >= 1) return 0;
  const q = 1 - p;
  return Math.max(0, (b * p - q) / b);
}

function simulateBankroll(
  initial: number,
  f: number,
  b: number,
  p: number,
  trades: number
): number[] {
  const q = 1 - p;
  const results: number[] = [initial];
  for (let n = 1; n <= trades; n++) {
    const bankroll =
      initial *
      Math.pow(1 + f * b, p * n) *
      Math.pow(Math.max(1 - f, 1e-10), q * n);
    results.push(Math.max(0, bankroll));
  }
  return results;
}

export const KellyCriterionCalculator: React.FC = () => {
  const [winRate, setWinRate] = useState<number>(55);
  const [avgWin, setAvgWin] = useState<number>(2);
  const [avgLoss, setAvgLoss] = useState<number>(1);
  const [accountSize, setAccountSize] = useState<number>(10000);
  const numTrades = 100;

  const { p, b, fullKelly, halfKelly, quarterKelly } = useMemo(() => {
    const p = winRate / 100;
    const b = avgLoss > 0 ? avgWin / avgLoss : 0;
    const fullKelly = kellyFraction(p, b);
    return {
      p,
      b,
      fullKelly,
      halfKelly: fullKelly / 2,
      quarterKelly: fullKelly / 4,
    };
  }, [winRate, avgWin, avgLoss]);

  const isPositiveEdge = fullKelly > 0;

  const chartData = useMemo(() => {
    if (!isPositiveEdge) return [];
    const full = simulateBankroll(accountSize, fullKelly, b, p, numTrades);
    const half = simulateBankroll(accountSize, halfKelly, b, p, numTrades);
    const quarter = simulateBankroll(accountSize, quarterKelly, b, p, numTrades);
    const fixed2 = simulateBankroll(accountSize, 0.02, b, p, numTrades);

    return full.map((_, i) => ({
      trade: i,
      "Full Kelly": Math.round(full[i]),
      "Half Kelly": Math.round(half[i]),
      "Quarter Kelly": Math.round(quarter[i]),
      "Fixed 2%": Math.round(fixed2[i]),
    }));
  }, [accountSize, fullKelly, halfKelly, quarterKelly, b, p, isPositiveEdge]);

  const chart = useChart({
    data: chartData,
    series: [
      { name: "Full Kelly", color: "teal.solid" },
      { name: "Half Kelly", color: "blue.solid" },
      { name: "Quarter Kelly", color: "purple.solid" },
      { name: "Fixed 2%", color: "orange.solid" },
    ],
  });

  const finalFull = chartData.length > 0 ? chartData[chartData.length - 1]["Full Kelly"] : accountSize;
  const finalHalf = chartData.length > 0 ? chartData[chartData.length - 1]["Half Kelly"] : accountSize;

  const numInput = (
    value: number,
    setter: (v: number) => void,
    decimals = false
  ) => ({
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(decimals ? /[^0-9.]/g : /[^0-9.]/g, "");
      setter(raw === "" || isNaN(Number(raw)) ? 0 : parseFloat(raw));
    },
  });

  return (
    <Flex minH="100vh" paddingTop={50} paddingBottom={50} justify="center" bg="bg.default">
      <Box p={8} w="80%" bg="bg.subtle" borderRadius="lg" shadow="lg" alignSelf="flex-start">
        <Heading textAlign="center" mb={6}>
          Kelly Criterion Calculator
        </Heading>

        <Flex gap={8} align="flex-start">
          {/* Inputs */}
          <Stack minW="260px" gap={3}>
            <Text fontWeight="semibold" fontSize="sm" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
              Trade Parameters
            </Text>

            <Text>Win Rate (%)</Text>
            <Input {...numInput(winRate, setWinRate, true)} />

            <Text>Average Win (%)</Text>
            <Input {...numInput(avgWin, setAvgWin, true)} />

            <Text>Average Loss (%)</Text>
            <Input {...numInput(avgLoss, setAvgLoss, true)} />

            <Text>Account Size ($)</Text>
            <Input {...numInput(accountSize, setAccountSize)} />

            {/* Stats */}
            <Box mt={4} p={4} bg="bg.muted" borderRadius="md">
              <Text fontWeight="bold" mb={3}>
                Kelly Results
              </Text>

              {!isPositiveEdge ? (
                <Text color="red.500" fontWeight="semibold">
                  Negative edge — Kelly recommends no position.
                </Text>
              ) : (
                <Grid templateColumns="1fr 1fr" gap={2}>
                  <Text color="fg.muted" fontSize="sm">Win/Loss Ratio</Text>
                  <Text fontWeight="semibold" fontSize="sm">{b.toFixed(2)}x</Text>

                  <Text color="fg.muted" fontSize="sm">Full Kelly</Text>
                  <Text fontWeight="semibold" fontSize="sm" color="teal.500">{toPercent(fullKelly)}</Text>

                  <Text color="fg.muted" fontSize="sm">Half Kelly</Text>
                  <Text fontWeight="semibold" fontSize="sm" color="blue.500">{toPercent(halfKelly)}</Text>

                  <Text color="fg.muted" fontSize="sm">Quarter Kelly</Text>
                  <Text fontWeight="semibold" fontSize="sm" color="purple.500">{toPercent(quarterKelly)}</Text>

                  <Text color="fg.muted" fontSize="sm">Full Kelly ($)</Text>
                  <Text fontWeight="semibold" fontSize="sm">{toUSD(fullKelly * accountSize)}</Text>

                  <Text color="fg.muted" fontSize="sm">Half Kelly ($)</Text>
                  <Text fontWeight="semibold" fontSize="sm">{toUSD(halfKelly * accountSize)}</Text>

                  <Text color="fg.muted" fontSize="sm">After 100 trades (Full)</Text>
                  <Text fontWeight="semibold" fontSize="sm">{toUSD(finalFull)}</Text>

                  <Text color="fg.muted" fontSize="sm">After 100 trades (Half)</Text>
                  <Text fontWeight="semibold" fontSize="sm">{toUSD(finalHalf)}</Text>
                </Grid>
              )}
            </Box>
          </Stack>

          {/* Chart */}
          <Box flex={1} minW="400px">
            <Text fontWeight="semibold" fontSize="sm" color="fg.muted" textTransform="uppercase" letterSpacing="wider" mb={3}>
              Bankroll Growth Over {numTrades} Trades (Geometric Mean)
            </Text>
            {isPositiveEdge ? (
              <Chart.Root maxH="md" chart={chart}>
                <LineChart data={chart.data}>
                  <CartesianGrid stroke={chart.color("border.muted")} vertical={false} />
                  <XAxis
                    axisLine={false}
                    tickLine={false}
                    dataKey={chart.key("trade")}
                    label={{ value: "Trades", position: "insideBottom", offset: -2 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={toUSD}
                    width={90}
                  />
                  <Tooltip
                    cursor={false}
                    animationDuration={100}
                    content={<CustomTooltip />}
                    formatter={(value: number) => toUSD(value)}
                  />
                  <Legend content={<Chart.Legend />} />
                  {chart.series.map((item) => (
                    <Line
                      key={item.name}
                      isAnimationActive={false}
                      dataKey={chart.key(item.name)}
                      stroke={chart.color(item.color)}
                      dot={false}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </Chart.Root>
            ) : (
              <Flex h="300px" align="center" justify="center" bg="bg.muted" borderRadius="md">
                <Text color="fg.muted">Enter valid parameters to see the simulation.</Text>
              </Flex>
            )}
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
};
