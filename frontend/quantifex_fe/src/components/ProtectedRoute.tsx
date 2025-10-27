import React from "react";
import type { ReactNode } from "react";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { Box, Link, Text } from "@chakra-ui/react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthCheck();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Box>
      <Text fontSize="md" textAlign="center" color="fg.muted">
        Login to view this page. {" "}
      </Text>
    </Box>
  );
};

export default ProtectedRoute;
