// API client — centralized Axios instance for all API calls

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Response interceptor — unwrap { success, data } envelope
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error || error.message || "Something went wrong";
    console.error("[API Error]", message);
    return Promise.reject({ message, details: error.response?.data?.details });
  }
);

export default api;
