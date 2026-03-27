import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Flex, Text, Spinner } from "@chakra-ui/react";
import { OptionsPricerForm, type FormValues } from "@/components/options/OptionsPricerForm";
import { GreeksPanel } from "@/components/options/GreeksPanel";
import { PayoffDiagram } from "@/components/options/PayoffDiagram";
import optionsService from "@/api/options";
import type { OptionsGreeks } from "@/models/Options";

const DEFAULT_VALUES: FormValues = {
  symbol: "",
  spot: "",
  strike: "",
  expiry_days: "30",
  iv: "25",
  rate: "5",
  option_type: "call",
  position: "long",
};

const OptionsPricerPage: React.FC = () => {
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES);
  const [greeks, setGreeks] = useState<OptionsGreeks | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPrice = useCallback(async (v: FormValues) => {
    const spot = parseFloat(v.spot);
    const strike = parseFloat(v.strike);
    const expiry_days = parseInt(v.expiry_days);
    const iv = parseFloat(v.iv) / 100;
    const rate = parseFloat(v.rate) / 100;

    if (!spot || !strike || !expiry_days || !iv || isNaN(rate)) return;
    if (spot <= 0 || strike <= 0 || expiry_days <= 0 || iv <= 0) return;

    setLoading(true);
    setError(null);
    try {
      const res = await optionsService.getOptionsPrice({
        symbol: v.symbol || undefined,
        spot,
        strike,
        expiry_days,
        iv,
        rate,
        option_type: v.option_type,
      });
      setGreeks(res.data);
    } catch (e: any) {
      const msg = e?.response?.data
        ? Object.values(e.response.data).flat().join(" ")
        : "Failed to fetch price.";
      setError(msg as string);
      setGreeks(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPrice(values), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [values, fetchPrice]);

  const spot = parseFloat(values.spot);
  const strike = parseFloat(values.strike);
  const premium = greeks?.price ?? 0;
  const showDiagram = !isNaN(spot) && spot > 0 && !isNaN(strike) && strike > 0 && premium > 0;

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <Text fontSize="2xl" fontWeight={800} mb={6}>
        Options Pricer
      </Text>

      <Flex gap={6} align="flex-start" flexWrap={{ base: "wrap", lg: "nowrap" }}>
        {/* Left: Inputs */}
        <Box
          w={{ base: "100%", lg: "280px" }}
          minW={{ lg: "280px" }}
          bg="bg.subtle"
          border="1px"
          borderColor="border.default"
          borderRadius="lg"
          p={5}
          flexShrink={0}
        >
          <OptionsPricerForm values={values} onChange={setValues} />
        </Box>

        {/* Right: Results */}
        <Box flex={1} minW={0}>
          {loading && (
            <Flex justify="center" align="center" h="120px">
              <Spinner size="md" color="teal.400" />
            </Flex>
          )}

          {error && !loading && (
            <Box
              p={4}
              bg="red.900"
              border="1px"
              borderColor="red.600"
              borderRadius="lg"
              mb={4}
            >
              <Text color="red.200" fontSize="sm">
                {error}
              </Text>
            </Box>
          )}

          {!loading && !greeks && !error && (
            <Flex
              justify="center"
              align="center"
              h="120px"
              border="1px"
              borderColor="border.default"
              borderRadius="lg"
              color="fg.muted"
              fontSize="sm"
            >
              Enter spot, strike, expiry, and IV to calculate.
            </Flex>
          )}

          {!loading && greeks && (
            <Box display="flex" flexDirection="column" gap={4}>
              <GreeksPanel greeks={greeks} option_type={values.option_type} />
              {showDiagram && (
                <PayoffDiagram
                  spot={spot}
                  strike={strike}
                  premium={premium}
                  option_type={values.option_type}
                  position={values.position}
                />
              )}
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default OptionsPricerPage;
