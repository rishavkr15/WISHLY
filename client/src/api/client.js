import axios from "axios";

const isProd = import.meta.env.MODE === "production";
const api = axios.create({
  baseURL: isProd ? "https://wishly-1.onrender.com/api" : (import.meta.env.VITE_API_URL || "http://localhost:5000/api"),
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

export const getErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;

export default api;
