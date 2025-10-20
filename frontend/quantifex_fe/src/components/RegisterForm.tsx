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
import userService from "@/api/user";

export const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Register attempt:", { email, password });

      await userService.registerUser(email, password);
      navigate("/login");
    } catch (err) {
      setError("Registration failed. Email may already be in use.");
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
              Create Account
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Sign up for a new account
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
                  minLength={8}
                  bg="bg.muted"
                  borderColor="border.default"
                  color="fg.default"
                  _placeholder={{ color: "fg.muted" }}
                  _hover={{ borderColor: "border.muted" }}
                  _focus={{ borderColor: "primary.default" }}
                />
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  Must be at least 8 characters
                </Text>
              </Box>

              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  mb={1}
                  color="fg.default"
                >
                  Confirm Password
                </Text>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                loadingText="Creating account..."
              >
                Sign Up
              </Button>
            </VStack>
          </form>

          <Text fontSize="sm" textAlign="center" color="fg.muted">
            Already have an account?{" "}
            <Link
              color="primary.default"
              cursor="pointer"
              fontWeight="medium"
              href="/login"
            >
              Sign in
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};
