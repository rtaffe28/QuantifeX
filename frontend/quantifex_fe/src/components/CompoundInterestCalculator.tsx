import React, { useState, useMemo } from "react";
import { Box, Stack, Input, Flex, Heading, Text } from "@chakra-ui/react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const toUSD = (val: number) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  return formatter.format(val);
};

// Custom tooltip component
const CustomTooltip = (props: any) => (
  <Box bg="white" color="black" p={2} borderRadius="md" boxShadow="md">
    <Chart.Tooltip {...props} />
  </Box>
);

export const CompoundInterestCalculator: React.FC = () => {
  const [initialValue, setInitialValue] = useState<number>(10000);
  const [yearlyReturn, setYearlyReturn] = useState<number>(7);
  const [yearlyContribution, setYearlyContribution] = useState<number>(1000);
  const [yearsCompounding, setYearsCompounding] = useState<number>(30);

  const chartData = useMemo(() => {
    let balance = initialValue;
    const data = [];
    for (let year = 0; year <= yearsCompounding; year++) {
      if (year > 0) {
        balance = balance * (1 + yearlyReturn / 100) + yearlyContribution;
      }
      data.push({
        year: `Year ${year}`,
        balance: Math.round(balance * 100) / 100,
      });
    }
    return data;
  }, [initialValue, yearlyReturn, yearlyContribution, yearsCompounding]);

  const finalBalance =
    chartData.length > 0 ? chartData[chartData.length - 1].balance : 0;
  const totalContributions = yearlyContribution * yearsCompounding;
  const totalGrowth = finalBalance - initialValue - totalContributions;

  const chart = useChart({
    data: chartData,
    series: [{ name: "balance", color: "teal.solid" }],
  });

  return (
    <Flex
      minH="100vh"
      paddingTop={50}
      verticalAlign={"top"}
      justify="center"
      bg="bg.default"
    >
      <Box
        p={8}
        h="650px"
        w="900px"
        bg="bg.subtle"
        borderRadius="lg"
        shadow="lg"
      >
        <Heading textAlign="center" mb={6}>
          Compound Interest Calculator
        </Heading>
        <Flex gap={8}>
          <Stack align="left" minW="300px">
            <Text>Initial Account Value</Text>
            <Input
              mb={3}
              placeholder="10000"
              value={initialValue}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setInitialValue(
                  val === "" || isNaN(Number(val)) ? 0 : parseFloat(val)
                );
              }}
            />
            <Text>Yearly Rate of Return</Text>
            <Input
              placeholder="7"
              value={yearlyReturn}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setYearlyReturn(
                  val === "" || isNaN(Number(val)) ? 0 : parseFloat(val)
                );
              }}
            />
            <Text>Yearly Contributions</Text>
            <Input
              mb={3}
              placeholder="1000"
              value={yearlyContribution}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setYearlyContribution(
                  val === "" || isNaN(Number(val)) ? 0 : parseFloat(val)
                );
              }}
            />
            <Text>Years Compounding</Text>
            <Input
              mb={3}
              placeholder="30"
              value={yearsCompounding}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setYearsCompounding(
                  val === "" || isNaN(Number(val)) ? 0 : parseInt(val)
                );
              }}
            />
          </Stack>
          <Box minW="350px" maxW="500px" flex={1}>
            <Chart.Root maxH="sm" chart={chart}>
              <AreaChart data={chart.data}>
                <CartesianGrid
                  stroke={chart.color("border.muted")}
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  tickLine={false}
                  dataKey={chart.key("year")}
                  tickFormatter={(value) => value.replace("Year ", "")}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={toUSD}
                />
                <Tooltip
                  cursor={false}
                  animationDuration={100}
                  content={<CustomTooltip />}
                  formatter={(value: number) => toUSD(value)}
                />
                <Legend content={<Chart.Legend />} />
                {chart.series.map((item) => (
                  <Area
                    key={item.name}
                    isAnimationActive={false}
                    dataKey={chart.key(item.name)}
                    fill={chart.color(item.color)}
                    fillOpacity={0.2}
                    stroke={chart.color(item.color)}
                    stackId="a"
                  />
                ))}
              </AreaChart>
            </Chart.Root>
          </Box>
        </Flex>
        <Flex
          verticalAlign={"top"}
          justify="center"
        >
          <Box
            mt={5}
            p={4}
            bg="bg.muted"
            borderRadius="md"
            display="flex"
            w="500px"
            flexDirection="column"
            alignItems="center"
          >
            <Text fontWeight="bold" mb={2}>
              Stats
            </Text>
            <Text>
              Final Balance: <b>{toUSD(finalBalance)}</b>
            </Text>
            <Text>
              Total Contributions: <b>{toUSD(totalContributions)}</b>
            </Text>
            <Text>
              Total Growth: <b>{toUSD(totalGrowth)}</b>
            </Text>
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
};
