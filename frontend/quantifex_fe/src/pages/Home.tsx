import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Box, Flex } from "@chakra-ui/react";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import userService from "@/api/user";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

const Home: React.FC = () => {
  const { isAuthenticated } = useAuthCheck();
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

  return (
    <Flex h="100vh" bg="bg.default" flexDirection="column">
      <Header isAuthenticated={isAuthenticated} username={username} />
      <Flex flex={1} overflow="hidden">
        <Sidebar />
        <Box flex={1} overflowY="auto" bg="bg.default">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Home;
