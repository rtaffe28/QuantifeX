import React from "react";
import { Box, Text, Flex, Spinner } from "@chakra-ui/react";
import type { OptionsData } from "@/models/OptionsData";
import { OptionsOverview } from "./OptionsOverview";
import { OptionsChainTable } from "./OptionsChainTable";
import { IVSkewChart } from "./IVSkewChart";
import { IVTermStructure } from "./IVTermStructure";
import { IVvsRVChart } from "./IVvsRVChart";
import { VolumeOIChart } from "./VolumeOIChart";

interface OptionsDetailPanelProps {
  data: OptionsData | null;
  loading: boolean;
  expirations: string[];
  selectedExpiration: string;
  onExpirationChange: (exp: string) => void;
}

export const OptionsDetailPanel: React.FC<OptionsDetailPanelProps> = ({
  data,
  loading,
  expirations,
  selectedExpiration,
  onExpirationChange,
}) => {
  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="teal.solid" />
      </Flex>
    );
  }

  if (!data) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Text fontSize="lg" color="fg.muted">
          Select a ticker from your watchlist to analyze options
        </Text>
      </Flex>
    );
  }

  return (
    <Box>
      <OptionsOverview data={data} />

      {/* Expiration selector */}
      {expirations.length > 0 && (
        <Box mb={6}>
          <Text fontSize="sm" fontWeight="semibold" color="fg.default" mb={2}>
            Expiration
          </Text>
          <Flex gap={1} flexWrap="wrap">
            {expirations.map((exp) => (
              <Box
                key={exp}
                as="button"
                px={3}
                py={1}
                fontSize="xs"
                borderRadius="md"
                border="1px solid"
                borderColor={
                  selectedExpiration === exp ? "teal.solid" : "border.muted"
                }
                bg={selectedExpiration === exp ? "teal.solid" : "transparent"}
                color={selectedExpiration === exp ? "white" : "fg.default"}
                cursor="pointer"
                onClick={() => onExpirationChange(exp)}
                _hover={{ borderColor: "teal.solid" }}
                transition="all 0.15s"
              >
                {exp}
              </Box>
            ))}
          </Flex>
        </Box>
      )}

      <OptionsChainTable
        calls={data.calls}
        puts={data.puts}
        currentPrice={data.current_price}
      />
      <IVSkewChart skew={data.iv_skew} currentPrice={data.current_price} />
      <IVTermStructure termStructure={data.term_structure} />
      <IVvsRVChart ivRv={data.iv_rv} />
      <VolumeOIChart
        data={data.volume_oi_by_strike}
        currentPrice={data.current_price}
      />
    </Box>
  );
};
