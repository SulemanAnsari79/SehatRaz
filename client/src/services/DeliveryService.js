import api from "./Api";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const deliveryLogin = (email, password) =>
  api.post("/api/delivery/login", { email, password });

export const getDeliveryProfile = () =>
  api.get("/api/delivery/profile", authHeader());

export const changeDeliveryPassword = (currentPassword, newPassword) =>
  api.put("/api/delivery/change-password", { currentPassword, newPassword }, authHeader());

export const deleteDeliveryAccount = (password) =>
  api.delete("/api/delivery/delete-account", { ...authHeader(), data: { password } });

// ─── Orders ───────────────────────────────────────────────────────────────────
export const getMyAssignedOrders = () =>
  api.get("/api/delivery/my-orders", authHeader());

// ─── OTP ──────────────────────────────────────────────────────────────────────
export const generateOtp = (orderId) =>
  api.post(`/api/delivery/orders/${orderId}/generate-otp`, {}, authHeader());

export const verifyOtp = (orderId, otp) =>
  api.post(`/api/delivery/orders/${orderId}/verify-otp`, { otp }, authHeader());

export const markOutForDelivery = (orderId) =>
  api.put(`/api/delivery/orders/${orderId}/out-for-delivery`, {}, authHeader());
