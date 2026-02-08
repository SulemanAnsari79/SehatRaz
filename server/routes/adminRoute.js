import express from 'express';
import adminAuth from '../middlewares/adminAuth.js';
import {adminDashboard, adminLogin, adminLogout, createProduct, createUser, deleteAppointment, deleteDoctor, deleteOrder, deleteProduct, deleteUser, getAdminStats, getAllAppointments, getAllDoctors, getAllOrders, getAllProducts, getAllUsers, getAppointmentById, getDoctorById, getOrderById, getProductById, getUserById, rejectDoctor, updateAppointment, updateOrderStatus, updateProduct, updateUser, verifyDoctor   } from '../controllers/adminController.js';



const adminRouter= express.Router();

adminRouter.post('/login', adminLogin);
adminRouter.post('/logout', adminLogout);

adminRouter.get('/stats',adminAuth, getAdminStats);

adminRouter.get('/dashboard',adminAuth, adminDashboard);
adminRouter.post('/create-user',adminAuth, createUser);
adminRouter.get('/users',adminAuth, getAllUsers);
adminRouter.get('/user/:id',adminAuth, getUserById);
adminRouter.put('/update-user/:id',adminAuth, updateUser);
adminRouter.delete('/delete-user/:id',adminAuth, deleteUser);


adminRouter.get('/doctors',adminAuth, getAllDoctors);
adminRouter.get('/doctor/:id',adminAuth, getDoctorById);
adminRouter.post('/verify-doctor/:id',adminAuth, verifyDoctor);
adminRouter.post('/reject-doctor/:id',adminAuth, rejectDoctor);
adminRouter.delete('/delete-doctor/:id',adminAuth, deleteDoctor);

adminRouter.post('/create-product',adminAuth, createProduct);
adminRouter.get('/products',adminAuth, getAllProducts);
adminRouter.get('/product/:id',adminAuth, getProductById);
adminRouter.put('/update-product/:id',adminAuth, updateProduct);
adminRouter.delete('/delete-product/:id',adminAuth, deleteProduct);

adminRouter.get('/orders',adminAuth, getAllOrders);
adminRouter.get('/order/:id',adminAuth, getOrderById);
adminRouter.put('/update-order-status/:id',adminAuth, updateOrderStatus);
adminRouter.delete('/delete-order/:id',adminAuth, deleteOrder);

adminRouter.get('/appointments',adminAuth, getAllAppointments);
adminRouter.get('/appointment/:id',adminAuth, getAppointmentById);
adminRouter.put('/update-appointment/:id',adminAuth, updateAppointment);
adminRouter.delete('/delete-appointment/:id',adminAuth, deleteAppointment);


export default adminRouter;