import axios from "axios";

// Determine base API URL dynamically based on environment:
// 1. Explicit production env var (REACT_APP_API_URL) if specified and not localhost
// 2. Localhost:8081/api during local development on localhost:3000
// 3. Fallback to production Render backend on Vercel or cloud
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL && !process.env.REACT_APP_API_URL.includes("localhost")) {
    return process.env.REACT_APP_API_URL;
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return process.env.REACT_APP_API_URL || "http://localhost:8081/api";
  }
  return process.env.REACT_APP_API_URL || "https://edh-backend-46pe.onrender.com/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token queue & handling
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 if not already refreshing and not calling auth endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/register") &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        return Promise.reject(error);
      }

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
        const refreshRes = await axios.post(
          `${getBaseURL()}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${currentToken}` } }
        );

        if (refreshRes.data && refreshRes.data.token) {
          const newToken = refreshRes.data.token;
          localStorage.setItem("token", newToken);
          if (refreshRes.data.username) {
            localStorage.setItem(
              "user",
              JSON.stringify({
                username: refreshRes.data.username,
                role: refreshRes.data.role || "ADMIN",
              })
            );
          }
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/register" &&
          window.location.pathname !== "/"
        ) {
          sessionStorage.setItem(
            "redirectAfterLogin",
            window.location.pathname + window.location.search
          );
          window.location.href = "/login";
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
