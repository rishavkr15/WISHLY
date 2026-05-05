import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
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
