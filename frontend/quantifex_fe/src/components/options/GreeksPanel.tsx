import React from "react";
import { Box, Grid, Text, Tooltip } from "@chakra-ui/react";
import type { OptionsGreeks } from "@/models/Options";

interface Props {
  greeks: OptionsGreeks;
  option_type: "call" | "put";
}

const TOOLTIPS: Record<string, string> = {
  "Option Price": "The fair value of the option contract computed via Black-Scholes.",
  "Intrinsic Value": "The in-the-money amount: max(0, S-K) for calls, max(0, K-S) for puts.",
  "Time Value": "The premium above intrinsic value; decays as expiry approaches.",
  Delta: "Rate of change of option price per $1 move in the underlying.",
  Gamma: "Rate of change of delta per $1 move in the underlying.",
  Theta: "Daily time decay — how much the option loses per calendar day.",
  Vega: "Sensitivity to a 1% change in implied volatility.",
  Rho: "Sensitivity to a 1% change in the risk-free rate.",
  Breakeven: "Underlying price at expiry where the position breaks even.",
};

interface StatItem {
  label: string;
  value: string;
  color?: string;
}

export const GreeksPanel: React.FC<Props> = ({ greeks, option_type }) => {
  const deltaColor =
    (option_type === "call" && greeks.delta > 0.5) ||
    (option_type === "put" && greeks.delta < -0.5)
      ? "green.400"
      : undefined;

  const stats: StatItem[] = [
    { label: "Option Price", value: `$${greeks.price.toFixed(4)}` },
    { label: "Intrinsic Value", value: `$${greeks.intrinsic_value.toFixed(4)}` },
    { label: "Time Value", value: `$${greeks.time_value.toFixed(4)}` },
    { label: "Delta", value: greeks.delta.toFixed(4), color: deltaColor },
    { label: "Gamma", value: greeks.gamma.toFixed(6) },
    { label: "Theta", value: greeks.theta.toFixed(6), color: "red.400" },
    { label: "Vega", value: greeks.vega.toFixed(6) },
    { label: "Rho", value: greeks.rho.toFixed(6) },
    { label: "Breakeven", value: `$${greeks.breakeven.toFixed(4)}` },
  ];

  return (
    <Box
      border="1px"
      borderColor="border.default"
      borderRadius="lg"
      p={4}
    >
      <Text fontSize="sm" fontWeight={700} mb={3} color="fg.muted" textTransform="uppercase" letterSpacing="wider">
        Greeks
      </Text>
      <Grid templateColumns="repeat(3, 1fr)" gap={3}>
        {stats.map(({ label, value, color }) => (
          <Box key={label} p={3} bg="bg.subtle" borderRadius="md">
            <Tooltip content={TOOLTIPS[label]} positioning={{ placement: "top" }}>
              <Text
                fontSize="xs"
                fontWeight={600}
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wide"
                cursor="help"
                mb={1}
              >
                {label}
              </Text>
            </Tooltip>
            <Text fontSize="md" fontWeight={700} color={color ?? "fg.default"}>
              {value}
            </Text>
          </Box>
        ))}
      </Grid>
    </Box>
  );
};
