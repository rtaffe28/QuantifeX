import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Auth utility functions
export const clearAuthTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);

  window.dispatchEvent(new Event("tokenUpdate"));
};

export const clearAllLocalStorage = (): void => {
  localStorage.clear();

  window.dispatchEvent(new Event("tokenUpdate"));
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN);
};

export const setAuthTokens = (access: string, refresh: string): void => {
  localStorage.setItem(ACCESS_TOKEN, access);
  localStorage.setItem(REFRESH_TOKEN, refresh);

  window.dispatchEvent(new Event("tokenUpdate"));
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

export const getUsernameFromToken = (token: string): string | null => {
  try {
    const { username } = JSON.parse(atob(token.split(".")[1]));
    return username || null;
  } catch {
    return null;
  }
};

// Additional token utilities
export const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  return !isTokenExpired(token);
};

export const getTokenPayload = (token: string): any | null => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

export const hasValidAccessToken = (): boolean => {
  const token = getAccessToken();
  return isValidToken(token);
};

export const hasValidRefreshToken = (): boolean => {
  const token = getRefreshToken();
  return isValidToken(token);
};
