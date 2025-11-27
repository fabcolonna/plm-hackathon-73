import { useMemo, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import type { UserRole, AuthContextValue, AuthedUser } from "./auth-context";

const STORAGE_KEY = "battery-passport:user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthedUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      // Parse stored user data
      return JSON.parse(raw) as AuthedUser;
    } catch (error) {
      console.warn("Failed to parse stored auth state", error);
      return null;
    }
  });

  const login = (role: UserRole) => {
    const nextUser = { role } satisfies AuthedUser;
    setUser(nextUser);

    // Store user data in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  };

  const logout = () => {
    setUser(null);

    // Remove user data from localStorage
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, login, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
