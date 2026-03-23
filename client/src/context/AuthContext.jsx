"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth.action";

const AuthContext = createContext(null);

/**
 * Reads the non-httpOnly `user` cookie on the client side.
 */
function getUserFromCookie() {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user="));
    if (!match) return null;
    return JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
  } catch {
    return null;
  }
}

export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();

  // Hydrate from cookie on mount (client-side)
  useEffect(() => {
    if (!user) {
      const cookieUser = getUserFromCookie();
      if (cookieUser) setUser(cookieUser);
    }
  }, [user]);

  const logout = useCallback(async () => {
    setUser(null);
    await logoutAction();
    router.push("/login");
  }, [router]);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider value={{ user, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export default AuthContext;
