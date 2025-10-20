import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Button,
  Text,
  VStack,
  HStack,
  Heading,
} from "@chakra-ui/react";
import { clearLocalAuthTokens } from "@/lib/utils";

interface HeaderProps {
  isAuthenticated?: boolean;
  username: string;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  username,
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearLocalAuthTokens();
    navigate("/");
  };

  return (
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
              variant="solid"
              colorPalette="teal"
              size="sm"
              color="white"
              _hover={{ bg: "gray.600" }}
            >
              Logout
            </Button>
          </HStack>
        ) : (
          <Button
            asChild
            variant="solid"
            colorPalette="teal"
            size="sm"
            _hover={{ bg: "gray.600" }}
          >
            <a href="/login">Login</a>
          </Button>
        )}
      </Flex>
    </Box>
  );
};
