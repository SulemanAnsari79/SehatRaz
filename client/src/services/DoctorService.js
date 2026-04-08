import api from "./Api.js";

// Authentication
export const doctorRegister = (data) => api.post("/doctor/register", data);

export const doctorLogin = (data) => api.post("/doctor/login", data);

export const doctorLogout = () => api.post("/doctor/logout");

// Profile Management
export const getDoctorProfile = () => api.get("/doctor/profile");
export const getVerifiedDoctors = () => api.get("/doctor/list");
export const changeDoctorPassword = (currentPassword, newPassword) =>
	api.put("/doctor/change-password", { currentPassword, newPassword });
export const deleteDoctorAccount = (password) =>
	api.delete("/doctor/delete-account", { data: { password } });

export const updateDoctorProfile = (data) => api.post("/doctor/updateprofile", data);
export const createLeaveRequest = (data) => api.post("/doctor/leave-request", data);
export const getMyLeaveRequests = () => api.get("/doctor/leave-requests");

// Appointments
export const getDoctorAppointments = () => api.get("/appointment/doctor-appointments");

export const bookAppointment = (data) => api.post("/appointment/book", data);

export const createAppointmentPaymentOrder = (data) =>
	api.post("/appointment/create-payment-order", data);

export const verifyAppointmentPayment = (data) =>
	api.post("/appointment/verify-payment", data);

export const getMyBookedAppointments = () => api.get("/appointment/my-booked");

export const getDoctorAvailability = (doctorId, date) =>
	api.get(`/appointment/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);

export const updateAppointmentStatus = (id, status) => api.post(`/appointment/updateAppointmentStatus/${id}`, { status });

// Products (for suggesting to patients)
export const getProducts = () => api.get("/product/list");

export const getProductById = (id) => api.get(`/product/get/${id}`);

// Recommendations
export const getProductRecommendations = () => api.get("/recommendation/products");

export const getRecommendationsByCategory = (category) => api.get(`/recommendation/category?category=${category}`);

export default api;
