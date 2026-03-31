import api from "./Api";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const deliveryLogin = (email, password) =>
  api.post("/api/delivery/login", { email, password });

// ─── Orders ───────────────────────────────────────────────────────────────────
export const getMyAssignedOrders = () =>
  api.get("/api/delivery/my-orders", authHeader());

// ─── OTP ──────────────────────────────────────────────────────────────────────
export const generateOtp = (orderId) =>
  api.post(`/api/delivery/orders/${orderId}/generate-otp`, {}, authHeader());

export const verifyOtp = (orderId, otp) =>
  api.post(`/api/delivery/orders/${orderId}/verify-otp`, { otp }, authHeader());
