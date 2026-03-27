import React from "react";
import { Box, VStack, Input, Text, HStack, Button } from "@chakra-ui/react";

export interface FormValues {
  symbol: string;
  spot: string;
  strike: string;
  expiry_days: string;
  iv: string;
  rate: string;
  option_type: "call" | "put";
  position: "long" | "short";
}

interface Props {
  values: FormValues;
  onChange: (next: FormValues) => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--chakra-colors-fg-muted)",
  marginBottom: "4px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid var(--chakra-colors-border-default)",
  background: "var(--chakra-colors-bg-default)",
  color: "var(--chakra-colors-fg-default)",
  fontSize: "14px",
  outline: "none",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <div style={labelStyle}>{label}</div>
      {children}
    </Box>
  );
}

export const OptionsPricerForm: React.FC<Props> = ({ values, onChange }) => {
  const set = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...values, [key]: e.target.value });

  const toggleType = (t: "call" | "put") => onChange({ ...values, option_type: t });
  const togglePos = (p: "long" | "short") => onChange({ ...values, position: p });

  const activeStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    borderRadius: "6px",
    fontWeight: active ? 700 : 400,
    background: active ? "var(--chakra-colors-teal-500)" : "transparent",
    color: active ? "#fff" : "var(--chakra-colors-fg-default)",
    border: "1px solid var(--chakra-colors-teal-500)",
    cursor: "pointer",
    padding: "6px 0",
    fontSize: "13px",
    transition: "all 0.15s",
  });

  return (
    <VStack align="stretch" gap={4}>
      <Text fontSize="lg" fontWeight={700}>
        Inputs
      </Text>

      <Field label="Ticker (optional)">
        <input
          style={inputStyle}
          placeholder="e.g. AAPL"
          value={values.symbol}
          onChange={set("symbol")}
        />
      </Field>

      <Field label="Spot Price ($)">
        <input
          style={inputStyle}
          type="number"
          min="0"
          placeholder="182.52"
          value={values.spot}
          onChange={set("spot")}
        />
      </Field>

      <Field label="Strike Price ($)">
        <input
          style={inputStyle}
          type="number"
          min="0"
          placeholder="185.00"
          value={values.strike}
          onChange={set("strike")}
        />
      </Field>

      <Field label="Days to Expiry">
        <input
          style={inputStyle}
          type="number"
          min="1"
          placeholder="30"
          value={values.expiry_days}
          onChange={set("expiry_days")}
        />
      </Field>

      <Field label="Implied Volatility (%)">
        <input
          style={inputStyle}
          type="number"
          min="0"
          step="0.1"
          placeholder="25.0"
          value={values.iv}
          onChange={set("iv")}
        />
      </Field>

      <Field label="Risk-Free Rate (%)">
        <input
          style={inputStyle}
          type="number"
          min="0"
          step="0.1"
          placeholder="5.0"
          value={values.rate}
          onChange={set("rate")}
        />
      </Field>

      <Box>
        <div style={labelStyle}>Option Type</div>
        <HStack gap={2}>
          <button
            style={activeStyle(values.option_type === "call")}
            onClick={() => toggleType("call")}
          >
            Call
          </button>
          <button
            style={activeStyle(values.option_type === "put")}
            onClick={() => toggleType("put")}
          >
            Put
          </button>
        </HStack>
      </Box>

      <Box>
        <div style={labelStyle}>Position</div>
        <HStack gap={2}>
          <button
            style={activeStyle(values.position === "long")}
            onClick={() => togglePos("long")}
          >
            Long
          </button>
          <button
            style={activeStyle(values.position === "short")}
            onClick={() => togglePos("short")}
          >
            Short
          </button>
        </HStack>
      </Box>
    </VStack>
  );
};
