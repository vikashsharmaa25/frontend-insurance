"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMeApi, sendOtpApi, verifyOtpApi, logoutApi } from "@/lib/apiService";

export interface AdminUser {
  _id: string;
  name: string;
  email?: string;
  role: string;
  phone: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  /** Step 1: Send OTP to mobile — returns dummy OTP for demo */
  sendOtp: (phone: string) => Promise<{ demoOtp: string }>;
  /** Step 2: Verify OTP and complete login */
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  sendOtp: async () => ({ demoOtp: "" }),
  verifyOtp: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // ── Helpers ────────────────────────────────────────────────────────────────

  const setAuthCookie = (token: string) => {
    if (typeof window !== "undefined") {
      document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax`;
    }
  };

  const setRefreshCookie = (token: string) => {
    if (typeof window !== "undefined") {
      document.cookie = `refreshToken=${token}; path=/; max-age=604800; SameSite=Lax`;
    }
  };

  const persistSession = (userData: AdminUser, accessToken: string, refreshToken?: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_user", JSON.stringify(userData));
      localStorage.setItem("accessToken", accessToken);
      setAuthCookie(accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
        setRefreshCookie(refreshToken);
      }
    }
  };

  const clearSession = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token");
      document.cookie = "accessToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "refreshToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };

  const checkLocalFallback = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_user");
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
          const existingToken = localStorage.getItem("accessToken");
          if (existingToken) setAuthCookie(existingToken);
          return true;
        } catch {
          // ignore
        }
      }
    }
    setUser(null);
    return false;
  };

  // ── Session restore on mount ───────────────────────────────────────────────

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await getMeApi();
      const userData = res.data?.data || res.data;
      if (userData && (userData.role === "ADMIN" || userData.role === "admin" || userData._id)) {
        setUser(userData);
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_user", JSON.stringify(userData));
          const existingToken = localStorage.getItem("accessToken");
          if (existingToken) setAuthCookie(existingToken);
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

  // ── Auth actions ───────────────────────────────────────────────────────────

  /** Step 1: Request OTP for phone number. Returns the dummy OTP for demo display. */
  const sendOtp = async (phone: string): Promise<{ demoOtp: string }> => {
    const res = await sendOtpApi(phone);
    const data = res.data?.data || res.data;
    const demoOtp: string = data?.demoOtp || data?.otp || "";
    return { demoOtp };
  };

  /** Step 2: Verify OTP and receive tokens → login user */
  const verifyOtp = async (phone: string, otp: string): Promise<void> => {
    const res = await verifyOtpApi(phone, otp);
    const data = res.data?.data || res.data;

    const userData: AdminUser = data?.user || {
      _id: "demo-id",
      name: "Admin User",
      email: "",
      phone,
      role: "ADMIN",
    };

    const accessToken: string =
      data?.accessToken || res.data?.accessToken || "icici_admin_session_token";
    const refreshToken: string | undefined =
      data?.refreshToken || res.data?.refreshToken;

    persistSession(userData, accessToken, refreshToken);
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
      clearSession();
      router.push("/login");
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, sendOtp, verifyOtp, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
