import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";

// Auth utility functions
export const clearLocalAuthTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);

  window.dispatchEvent(new Event("tokenUpdate"));
};

export const clearAllLocalStorage = (): void => {
  localStorage.clear();

  window.dispatchEvent(new Event("tokenUpdate"));
};

export const getLocalAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN);
};

export const getLocalRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN);
};

export const setLocalAuthTokens = (access: string, refresh: string): void => {
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
