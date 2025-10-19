import React, { useState, useEffect } from "react";
import { Link as RouterLink, Outlet, useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Button,
  Text,
  VStack,
  HStack,
  Link,
  Heading,
} from "@chakra-ui/react";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { clearLocalAuthTokens } from "@/lib/utils";
import userService from "@/api/user";

const Home: React.FC = () => {
  const { isAuthenticated } = useAuthCheck();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("unknown");

  useEffect(() => {
    if (isAuthenticated) {
      userService
        .getUser()
        .then((user) => {
          setUsername(user.username || "unknown");
        })
        .catch(() => {
          setUsername("unknown");
        });
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    clearLocalAuthTokens();
    navigate("/");
  };

  return (
    <Flex h="100vh" bg="bg.default" flexDirection="column">
      {/* Header Bar */}
      <Box
        bg="bg.subtle"
        borderBottom="1px"
        borderColor="border.default"
        px={6}
        py={3}
      >
        <Flex justify="space-between" align="center">
          <Heading size="lg" color="primary.default">
            QuantifeX
          </Heading>

          {isAuthenticated ? (
            <HStack gap={4}>
              <VStack gap={0} align="end">
                <Text fontSize="xs" color="fg.muted">
                  Logged in as
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="fg.default">
                  {username}
                </Text>
              </VStack>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                colorPalette="gray"
              >
                Logout
              </Button>
            </HStack>
          ) : (
            <Button
              variant="solid"
              colorPalette="teal"
              size="sm"
            >
              Login
            </Button>
          )}
        </Flex>
      </Box>

      <Flex flex={1} overflow="hidden">
        {/* Sidebar */}
        <Box
          w="64"
          bg="bg.subtle"
          color="fg.default"
          display="flex"
          flexDirection="column"
          borderRight="1px"
          borderColor="border.default"
        >
          {/* Navigation */}
          <VStack align="stretch" gap={2} p={4}>
            <Link
              as={RouterLink}
              href="/"
              px={3}
              py={2}
              rounded="md"
              color="fg.default"
              _hover={{ bg: "bg.muted", color: "primary.emphasized" }}
              transition="all 0.2s"
              textDecoration="none"
            >
              Home
            </Link>

            <Link
              as={RouterLink}
              href="/watchlist"
              px={3}
              py={2}
              rounded="md"
              color="fg.default"
              _hover={{ bg: "bg.muted", color: "primary.emphasized" }}
              transition="all 0.2s"
              textDecoration="none"
            >
              Watchlist
            </Link>

            <Link
              as={RouterLink}
              href="/compound-interest-calculator"
              px={3}
              py={2}
              rounded="md"
              color="fg.default"
              _hover={{ bg: "bg.muted", color: "primary.emphasized" }}
              transition="all 0.2s"
              textDecoration="none"
            >
              Compound Interest Calculator
            </Link>
          </VStack>
        </Box>

        {/* Main Content */}
        <Box flex={1} overflowY="auto" bg="bg.default">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Home;
