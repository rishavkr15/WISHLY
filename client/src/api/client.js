import axios from "axios";

let BASE_URL = import.meta.env.VITE_API_URL || "https://wishly-backend-4r3f.onrender.com/api";

// Auto-fix if user forgot /api in their environment variables
if (!BASE_URL.endsWith('/api')) {
  if (BASE_URL.endsWith('/')) BASE_URL = BASE_URL.slice(0, -1);
  BASE_URL = `${BASE_URL}/api`;
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000 // Increased from 10s to 60s to allow Render free tier to wake up
});

api.interceptors.request.use((config) => {
  const authRaw = localStorage.getItem("wishly_auth");
  if (authRaw) {
    const auth = JSON.parse(authRaw);
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const originalRequestUrl = error.config?.url || "";
      if (!originalRequestUrl.includes("/auth/login")) {
        localStorage.removeItem("wishly_auth");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;

export default api;
