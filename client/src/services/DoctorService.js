import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:4000/api" });

// Authentication
export const doctorRegister = (data) => API.post("/doctor/register", data);

export const doctorLogin = (data) => API.post("/doctor/login", data);

export const doctorLogout = () => API.post("/doctor/logout", {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

// Profile Management
export const getDoctorProfile = () => API.get("/doctor/profile", {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export const updateDoctorProfile = (data) => API.post("/doctor/updateprofile", data, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

// Appointments
export const getDoctorAppointments = () => API.get("/appointment/doctor-appointments", {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export const updateAppointmentStatus = (id, status) => API.post(`/appointment/updateAppointmentStatus/${id}`, { status }, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

// Products (for suggesting to patients)
export const getProducts = () => API.get("/product/list");

export const getProductById = (id) => API.get(`/product/get/${id}`);

// Recommendations
export const getProductRecommendations = () => API.get("/recommendation/products", {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export const getRecommendationsByCategory = (category) => API.get(`/recommendation/category?category=${category}`, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export default API;
