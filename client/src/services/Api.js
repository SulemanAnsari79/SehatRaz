import axios from "axios";

// Backend base URL
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // optional but recommended
});

// =========================
// Request Interceptor
// =========================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// =========================
// Response Interceptor
// =========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    console.error("Response Error:", status, error.response?.data);

    if (status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);


export default api;
