"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, type UserPublic } from "./api-client";

interface AuthContextValue {
  user: UserPublic | null;
  token: string | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<UserPublic>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "tradebridge.auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ token: string; user: UserPublic } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrating auth state from localStorage can only happen client-side after
  // mount, so a one-time setState here is unavoidable (and safe: it runs once).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { token: string; user: UserPublic };
      setSession(parsed);
      // Revalidate against the API in the background.
      authApi
        .me(parsed.token)
        .then((freshUser) => setSession({ token: parsed.token, user: freshUser }))
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
          setSession(null);
        });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const res = await authApi.login(usernameOrEmail, password);
    const next = { token: res.access_token, user: res.user };
    setSession(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const user = session?.user ?? null;
  const token = session?.token ?? null;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
