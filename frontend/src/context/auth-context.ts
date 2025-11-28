import { createContext } from "react";

export type UserRole = "garage" | "recycler";

export type AuthedUser = {
  role: UserRole;
};

export type AuthContextValue = {
  user: AuthedUser | null;
  login: (role: UserRole) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);
