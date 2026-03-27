import React, { useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface Props {
  spot: number;
  strike: number;
  premium: number;
  option_type: "call" | "put";
  position: "long" | "short";
}

export const PayoffDiagram: React.FC<Props> = ({
  spot,
  strike,
  premium,
  option_type,
  position,
}) => {
  const data = useMemo(() => {
    const lo = spot * 0.7;
    const hi = spot * 1.3;
    const steps = 80;
    const step = (hi - lo) / steps;
    const sign = position === "long" ? 1 : -1;

    return Array.from({ length: steps + 1 }, (_, i) => {
      const s = lo + i * step;
      let intrinsic: number;
      if (option_type === "call") {
        intrinsic = Math.max(0, s - strike);
      } else {
        intrinsic = Math.max(0, strike - s);
      }
      const pnl = sign * (intrinsic - premium);
      return { price: parseFloat(s.toFixed(2)), pnl: parseFloat(pnl.toFixed(4)) };
    });
  }, [spot, strike, premium, option_type, position]);

  const breakeven =
    option_type === "call"
      ? position === "long"
        ? strike + premium
        : strike + premium
      : position === "long"
      ? strike - premium
      : strike - premium;

  return (
    <Box
      border="1px"
      borderColor="border.default"
      borderRadius="lg"
      p={4}
    >
      <Text fontSize="sm" fontWeight={700} mb={3} color="fg.muted" textTransform="uppercase" letterSpacing="wider">
        Payoff at Expiry
      </Text>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chakra-colors-border-default)" />
          <XAxis
            dataKey="price"
            tickFormatter={(v) => `$${v}`}
            tick={{ fontSize: 11 }}
            stroke="var(--chakra-colors-fg-muted)"
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fontSize: 11 }}
            stroke="var(--chakra-colors-fg-muted)"
          />
          <Tooltip
            formatter={(v: number) => [`$${v.toFixed(2)}`, "P&L"]}
            labelFormatter={(l) => `Price: $${l}`}
            contentStyle={{
              background: "var(--chakra-colors-bg-subtle)",
              border: "1px solid var(--chakra-colors-border-default)",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          />
          {/* Breakeven line */}
          <ReferenceLine y={0} stroke="#888" strokeDasharray="4 4" label={{ value: "BE", fontSize: 10 }} />
          {/* Current spot vertical */}
          <ReferenceLine
            x={parseFloat(spot.toFixed(2))}
            stroke="var(--chakra-colors-teal-400)"
            strokeDasharray="4 4"
            label={{ value: "Spot", fontSize: 10, fill: "var(--chakra-colors-teal-400)" }}
          />
          {/* Strike vertical */}
          <ReferenceLine
            x={parseFloat(strike.toFixed(2))}
            stroke="#888"
            strokeDasharray="4 4"
            label={{ value: "Strike", fontSize: 10, fill: "#888" }}
          />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke="var(--chakra-colors-teal-400)"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};
