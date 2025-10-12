import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import AxiosInstance from "@/api/axios";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "@/constants";
import type { JWTPayload, TokenRefreshResponse } from "@/models/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    auth().catch(() => setIsAuthorized(false));
  }, []);

  const refreshToken = async (): Promise<void> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);

    if (!refreshToken) {
      setIsAuthorized(false);
      return;
    }

    try {
      const res = await AxiosInstance.post<TokenRefreshResponse>(
        "/token/refresh/",
        {
          refresh: refreshToken,
        }
      );

      if (res.status === 200 && res.data.access) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      setIsAuthorized(false);

      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
    }
  };

  const auth = async (): Promise<void> => {
    const token = localStorage.getItem(ACCESS_TOKEN);

    if (!token) {
      setIsAuthorized(false);
      return;
    }

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const tokenExpiration = decoded.exp;
      const now = Date.now() / 1000;

      if (tokenExpiration < now) {
        await refreshToken();
      } else {
        setIsAuthorized(true);
      }
    } catch (error) {
      console.error("Token decode failed:", error);
      setIsAuthorized(false);

      localStorage.removeItem(ACCESS_TOKEN);
    }
  };

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
