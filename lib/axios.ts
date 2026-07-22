import axios from "axios";

// Base URL for API requests
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://web-production-63f48.up.railway.app";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to extract cookie value by name
export function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Request Interceptor: Automatically extract accessToken from cookies or localStorage & attach to Authorization header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // 1. Try reading token from cookies (accessToken, token, or jwt)
      const tokenFromCookie = getCookieValue("accessToken") || getCookieValue("token") || getCookieValue("jwt");

      // 2. Try reading token from localStorage
      const tokenFromStorage = localStorage.getItem("accessToken") || localStorage.getItem("token");

      const token = tokenFromCookie || tokenFromStorage;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
