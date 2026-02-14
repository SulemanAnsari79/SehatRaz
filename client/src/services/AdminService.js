import axios from "axios";

const API = axios.create({baseURL: "http://localhost:4000/api"});

// Statistics
export const getStats = () => API.get("/stats");

// Users
export const getUsers = () => API.get("/users");
export const deleteUser = (id) => API.delete(`/users/${id}`);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);

// Doctors
export const getDoctors = () => API.get("/doctors");
export const deleteDoctor = (id) => API.delete(`/doctors/${id}`);
export const updateDoctor = (id, data) => API.put(`/doctors/${id}`, data);

// Products
export const getProducts = () => API.get("/product/list", { withCredentials: true });
export const createProduct = (data) => API.post("/product/create-product", data, {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}});
export const updateProduct = (id, data) => API.put(`/product/update-product/${id}`, data, {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}});
export const deleteProduct = (id) => API.delete(`/product/delete-product/${id}`);

// Orders
export const getOrders = () => API.get("/orders");
export const updateOrderStatus = (id, status) => API.put(`/orders/${id}`, { status });

// Appointments
export const getAppointments = () => API.get("/appointments");
export const updateAppointmentStatus = (id, status) => API.put(`/appointments/${id}`, { status });

export default API;
