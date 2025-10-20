import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  Container,
  Link,
} from "@chakra-ui/react";
import tokenService from "@/api/token";
import { setLocalAuthTokens } from "@/lib/utils";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Login attempt:", { email, password });

      const res = await tokenService.postToken(email, password);
      
      setLocalAuthTokens(res.data.access, res.data.refresh);
      navigate("/");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <Box
        bg="bg.subtle"
        border="1px"
        borderColor="border.default"
        borderRadius="lg"
        p={8}
        shadow="lg"
      >
        <VStack gap={6} align="stretch">
          <VStack gap={2}>
            <Heading size="xl" color="fg.default">
              Login
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Sign in to your account
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  mb={1}
                  color="fg.default"
                >
                  Email
                </Text>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  bg="bg.muted"
                  borderColor="border.default"
                  color="fg.default"
                  _placeholder={{ color: "fg.muted" }}
                  _hover={{ borderColor: "border.muted" }}
                  _focus={{ borderColor: "primary.default" }}
                />
              </Box>

              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  mb={1}
                  color="fg.default"
                >
                  Password
                </Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  bg="bg.muted"
                  borderColor="border.default"
                  color="fg.default"
                  _placeholder={{ color: "fg.muted" }}
                  _hover={{ borderColor: "border.muted" }}
                  _focus={{ borderColor: "primary.default" }}
                />
              </Box>

              {error && (
                <Text color="red.400" fontSize="sm">
                  {error}
                </Text>
              )}

              <Button
                type="submit"
                variant="solid"
                colorPalette="teal"
                size="lg"
                w="full"
                loading={isLoading}
                loadingText="Signing in..."
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Text fontSize="sm" textAlign="center" color="fg.muted">
            Don't have an account?{" "}
            <Link
              color="primary.default"
              cursor="pointer"
              fontWeight="medium"
              href="/register"
            >
              Sign up
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};
