export interface JWTPayload {
  exp: number;
  user_id?: number;
  username?: string;
  [key: string]: any;
}

export interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined?: string;
  last_login?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user?: User;
}
