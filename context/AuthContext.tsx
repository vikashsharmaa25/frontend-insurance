"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMeApi, loginApi, logoutApi } from "@/lib/apiService";

export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const setAuthCookie = (token: string) => {
    if (typeof window !== "undefined") {
      document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax`;
    }
  };

  const checkLocalFallback = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_user");
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
          const existingToken = localStorage.getItem("accessToken") || "icici_admin_session_token";
          setAuthCookie(existingToken);
          return true;
        } catch {
          // Ignore
        }
      }
    }
    setUser(null);
    return false;
  };

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await getMeApi();
      const userData = res.data?.data || res.data;
      if (userData && (userData.role === "ADMIN" || userData.role === "admin" || userData._id)) {
        setUser(userData);
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_user", JSON.stringify(userData));
          const existingToken = localStorage.getItem("accessToken") || "icici_admin_session_token";
          setAuthCookie(existingToken);
        }
      } else {
        checkLocalFallback();
      }
    } catch {
      checkLocalFallback();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginApi(email, password);
    const data = res.data?.data || res.data;
    const userData = data?.user || data || {
      _id: "60c72b2f9b1d8b2e88a12345",
      firstName: "Super",
      lastName: "Admin",
      email: email || "admin@example.com",
      role: "ADMIN",
    };

    // Extract token if present in login response payload
    const token =
      data?.accessToken ||
      res.data?.accessToken ||
      data?.token ||
      res.data?.token ||
      "icici_admin_session_token";

    const refreshToken =
      data?.refreshToken ||
      res.data?.refreshToken;

    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", token);
      setAuthCookie(token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
        document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
      }
      localStorage.setItem("admin_user", JSON.stringify(userData));
    }

    setUser(userData);
    router.push("/admin/dashboard");
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("token");
        document.cookie = "accessToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "refreshToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      router.push("/login");
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
