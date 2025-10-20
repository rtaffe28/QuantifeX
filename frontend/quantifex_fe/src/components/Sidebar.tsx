import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, VStack, Link } from "@chakra-ui/react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/watchlist", label: "Watchlist" },
  {
    to: "/compound-interest-calculator",
    label: "Compound Interest Calculator",
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <Box
      w="64"
      bg="bg.subtle"
      color="fg.default"
      display="flex"
      flexDirection="column"
      borderRight="1px"
      borderColor="border.default"
    >
      <VStack align="stretch" gap={2} p={4}>
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;

          return (
            <Link
              key={link.to}
              href={link.to}
              px={3}
              py={2}
              rounded="md"
              color="fg.default"
              bg={isActive ? "bg.muted" : "transparent"}
              _hover={{ bg: "bg.muted", color: "primary.emphasized" }}
              transition="all 0.2s"
              textDecoration="none"
              fontWeight={isActive ? "semibold" : "normal"}
            >
              {link.label}
            </Link>
          );
        })}
      </VStack>
    </Box>
  );
};
