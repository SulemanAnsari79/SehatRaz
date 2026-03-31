import axios from "axios";

const API = axios.create({baseURL: "http://localhost:4000/api"}); 

// Statistics
export const getStats = () => API.get("/admin/stats",{headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}});

// Users
export const getUsers = () => API.get("/user/users", {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}} );
export const createUser = (data) => API.post("/user/create-user", data, {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}} );
export const updateUser = (id, data) => API.put(`/user/update-user/${id}`, data, {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}} );
export const deleteUser = (id) => API.delete(`/user/delete-user/${id}`, {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}} );

// Doctors
export const getDoctors = () =>
	API.get("/admin/doctors", {
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
	});
export const createDoctor = (data) =>
	API.post("/admin/doctors", data, {
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
	});
export const deleteDoctor = (id) =>
	API.delete(`/admin/delete-doctor/${id}`, {
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
	});
export const verifyDoctor = (id) =>
	API.post(
		`/admin/verify-doctor/${id}`,
		{},
		{ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
	);
export const rejectDoctor = (id, reason) =>
	API.post(
		`/admin/reject-doctor/${id}`,
		{ reason },
		{ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
	);
export const updateDoctor = (id, data) =>
	API.put(`/doctors/${id}`, data, {
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
	});
export const getAdminDoctors = () =>
	API.get("/admin/doctors", {
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
	});
export const getLeaveRequests = (status = "") =>
	API.get(`/admin/leave-requests${status ? `?status=${encodeURIComponent(status)}` : ""}`, {
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
	});
export const approveLeaveRequest = (id, adminNote = "") =>
	API.post(
		`/admin/leave-requests/${id}/approve`,
		{ adminNote },
		{ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
	);
export const rejectLeaveRequest = (id, adminNote = "") =>
	API.post(
		`/admin/leave-requests/${id}/reject`,
		{ adminNote },
		{ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
	);

// Products
export const getProducts = () => API.get("/product/list", { withCredentials: true });
export const createProduct = (data) => API.post('/product/create-product', data, {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}});
export const updateProduct = (id, data) => API.put(`/product/update-product/${id}`, data, {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}});
export const deleteProduct = (id) => API.delete(`/admin/delete-product/${id}`, {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}});

// Orders
export const getOrders = () => API.get("/order/orders", {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}});
export const updateOrderStatus = (id, data) => API.put(`/order/orders/${id}`, data, {headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}});

// Appointments
export const getAppointments = () => 
	API.get("/appointment/all", { 
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
	});

export const deleteAppointment = (id) => 
	API.delete(`/appointment/admin/cancel/${id}`, { 
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
	});

export const createAdminAppointment = (data) => 
	API.post("/appointment/admin/create", data, { 
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
	});

export const updateAppointmentStatus = (id, status) => 
	API.put(`/appointment/${id}`, { status }, { 
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
	});

// Delivery Men
export const getDeliveryMen = () =>
	API.get("/admin/delivery-men", {
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
	});

// Notices
export const sendNoticeEmails = (data) =>
	API.post("/admin/notices/send", data, {
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
	});

export const getRecentNotices = () =>
	API.get("/admin/notices/recent", {
		headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
	});

export default API;
