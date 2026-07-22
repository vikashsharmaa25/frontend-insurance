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

// Response Interceptor: Handles 401 Unauthorized errors and attempts token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and not already retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/login") &&
      !originalRequest.url?.includes("/api/auth/refresh-token")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken =
          getCookieValue("refreshToken") ||
          (typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null);

        // Make refresh request
        const res = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        const newAccessToken =
          res.data?.data?.accessToken ||
          res.data?.accessToken ||
          res.data?.token;

        const newRefreshToken =
          res.data?.data?.refreshToken ||
          res.data?.refreshToken;

        if (newAccessToken) {
          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", newAccessToken);
            document.cookie = `accessToken=${newAccessToken}; path=/; max-age=86400; SameSite=Lax`;

            if (newRefreshToken) {
              localStorage.setItem("refreshToken", newRefreshToken);
              document.cookie = `refreshToken=${newRefreshToken}; path=/; max-age=604800; SameSite=Lax`;
            }
          }

          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return api(originalRequest);
        } else {
          throw new Error("No new access token received");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);

        // Session expired: Clear auth and redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("admin_user");
          document.cookie = "accessToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "refreshToken=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";

          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
