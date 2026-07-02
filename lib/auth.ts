import Cookies from "js-cookie";

const TOKEN_KEY = "cashier_token";
const USER_KEY = "cashier_user";
const SESSION_COOKIE = "cashier_session"; // lightweight cookie for middleware

export interface AuthUser {
  id: number;
  username: string;
  nama: string;
  role: "kasir" | "admin" | "owner";
  is_active: boolean;
}

export function saveAuth(token: string, user: AuthUser) {
  // localStorage — used by api.ts for Authorization header (client-side only)
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // cookie — used by middleware for server-side route protection
  Cookies.set(SESSION_COOKIE, user.role, { expires: 0.75, path: "/" });
}

export function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(TOKEN_KEY) ?? undefined;
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  Cookies.remove(SESSION_COOKIE, { path: "/" });
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
