import axios from "axios";

const API = axios.create({baseURL: "http://localhost:5000/api/admin",withCredentials: true});

export const getStats = () => API.get("/stats");
export const getUsers = () => API.get("/users");
// export const getDoctors = () => API.get("/doctors");
// export const getProducts = () => API.get("/products");
// export const getOrders = () => API.get("/orders");
