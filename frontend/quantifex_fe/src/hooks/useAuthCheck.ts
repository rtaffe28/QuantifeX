import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import tokenService from "@/api/token";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "@/constants";
import { getLocalRefreshToken } from "@/lib/utils";

export const useAuthCheck = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const refreshToken = async (): Promise<boolean> => {
    const refreshToken = getLocalRefreshToken();

    if (!refreshToken) {
      return false;
    }

    try {
      const res = await tokenService.postRefresh(refreshToken);

      if (res.status === 200 && res.data.access) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
      return false;
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem(ACCESS_TOKEN);

    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      const tokenExpiration = decoded.exp!;
      const now = Date.now() / 1000;

      if (tokenExpiration < now) {
        return await refreshToken();
      } else {
        return true;
      }
    } catch (error) {
      console.error("Token decode failed:", error);
      localStorage.removeItem(ACCESS_TOKEN);
      return false;
    }
  };

  useEffect(() => {
    checkAuth()
      .then(setIsAuthenticated)
      .catch(() => setIsAuthenticated(false));
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN || e.key === REFRESH_TOKEN) {
        checkAuth()
          .then(setIsAuthenticated)
          .catch(() => setIsAuthenticated(false));
      }
    };

    const handleTokenUpdate = () => {
      checkAuth()
        .then(setIsAuthenticated)
        .catch(() => setIsAuthenticated(false));
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("tokenUpdate", handleTokenUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tokenUpdate", handleTokenUpdate);
    };
  }, []);

  return {
    isAuthenticated,
    loading: isAuthenticated === null,
    checkAuth,
  };
};
