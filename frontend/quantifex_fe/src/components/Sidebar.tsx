import React, { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, Text, VStack } from "@chakra-ui/react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface NavLink {
  to: string;
  label: string;
}

interface NavSection {
  title: string;
  links: NavLink[];
}

const navSections: NavSection[] = [
  {
    title: "Portfolio",
    links: [
      { to: "/", label: "Home" },
      { to: "/watchlist", label: "Watchlist" },
      { to: "/transactions", label: "Transactions" },
    ],
  },
  {
    title: "Tools",
    links: [
      { to: "/compound-interest-calculator", label: "Compound Interest Calculator" },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

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
      <VStack align="stretch" gap={4} p={4}>
        {navSections.map((section) => {
          const isCollapsed = collapsed[section.title] ?? false;

          return (
            <Box key={section.title}>
              <Box
                as="button"
                display="flex"
                alignItems="center"
                gap={1}
                width="100%"
                px={3}
                mb={isCollapsed ? 0 : 2}
                cursor="pointer"
                onClick={() => toggleSection(section.title)}
                bg="transparent"
                border="none"
                _hover={{ opacity: 0.7 }}
                transition="opacity 0.2s"
              >
                {isCollapsed ? (
                  <FiChevronRight size={14} />
                ) : (
                  <FiChevronDown size={14} />
                )}
                <Text
                  fontSize="xs"
                  fontWeight={700}
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color="fg.muted"
                >
                  {section.title}
                </Text>
              </Box>
              {!isCollapsed && (
                <VStack align="stretch" gap={1}>
                  {section.links.map((link) => {
                    const isActive = location.pathname === link.to;

                    return (
                      <RouterLink
                        key={link.to}
                        to={link.to}
                        style={{
                          display: "block",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          textDecoration: "none",
                          color: "inherit",
                          fontWeight: isActive ? 600 : 400,
                          backgroundColor: isActive ? "var(--chakra-colors-bg-muted)" : "transparent",
                          transition: "all 0.2s",
                        }}
                      >
                        {link.label}
                      </RouterLink>
                    );
                  })}
                </VStack>
              )}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
};
