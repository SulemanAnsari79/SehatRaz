import express from 'express';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/uploadImg.js';
import {adminDashboard, adminLogin, adminLogout, createUser, deleteAppointment, deleteDoctor, deleteOrder, deleteProduct, getAdminStats, getAllAppointments, getAllDoctors, getAllProducts, getAppointmentById, getDoctorById, getOrderById, getProductById, getUserById, rejectDoctor, updateAppointment, updateOrderStatus, updateProduct, verifyDoctor, createDoctor, updateDoctor,
  createDeliveryMan, getAllDeliveryMen, deleteDeliveryMan, toggleDeliveryManStatus, assignOrderToDelivery, sendNoticeEmails, getRecentNotices
, getLeaveRequests, approveLeaveRequest, rejectLeaveRequest
, getDeliveryLocationRules, updateDeliveryLocationRules
} from '../controllers/adminController.js';



const adminRouter= express.Router(); 

adminRouter.post('/login', adminLogin);
adminRouter.post('/logout', adminLogout);

adminRouter.get('/stats',adminAuth, getAdminStats);

adminRouter.get('/dashboard',adminAuth, adminDashboard);
adminRouter.post('/create-user',adminAuth, createUser);
// adminRouter.get('/users',adminAuth, getAllUsers);
adminRouter.get('/user/:id',adminAuth, getUserById);
// adminRouter.put('/update-user/:id',adminAuth, updateUser);
// adminRouter.delete('/delete-user/:id',adminAuth, deleteUser);


adminRouter.get('/doctors',adminAuth, getAllDoctors);
adminRouter.get('/leave-requests', adminAuth, getLeaveRequests);
adminRouter.post('/leave-requests/:id/approve', adminAuth, approveLeaveRequest);
adminRouter.post('/leave-requests/:id/reject', adminAuth, rejectLeaveRequest);
adminRouter.get('/doctor/:id',adminAuth, getDoctorById);
adminRouter.post('/doctors',adminAuth, createDoctor);
adminRouter.put('/doctors/:id',adminAuth, updateDoctor);
adminRouter.post('/verify-doctor/:id',adminAuth, verifyDoctor);
adminRouter.post('/reject-doctor/:id',adminAuth, rejectDoctor);
adminRouter.delete('/delete-doctor/:id',adminAuth, deleteDoctor);

// adminRouter.post('/create-product',adminAuth,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]), createProduct);
adminRouter.get('/products',adminAuth, getAllProducts);
adminRouter.get('/product/:id',adminAuth, getProductById);
adminRouter.put('/update-product/:id',adminAuth,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]), updateProduct);
adminRouter.delete('/delete-product/:id',adminAuth, deleteProduct);

adminRouter.get('/order/:id',adminAuth, getOrderById);
adminRouter.put('/update-order-status/:id',adminAuth, updateOrderStatus);
adminRouter.delete('/delete-order/:id',adminAuth, deleteOrder);

adminRouter.get('/appointments',adminAuth, getAllAppointments);
adminRouter.get('/appointment/:id',adminAuth, getAppointmentById);
adminRouter.put('/update-appointment/:id',adminAuth, updateAppointment);
adminRouter.delete('/delete-appointment/:id',adminAuth, deleteAppointment);

// Delivery Man Management
adminRouter.post('/delivery-men',adminAuth, createDeliveryMan);
adminRouter.get('/delivery-men',adminAuth, getAllDeliveryMen);
adminRouter.delete('/delivery-men/:id',adminAuth, deleteDeliveryMan);
adminRouter.patch('/delivery-men/:id/toggle-status',adminAuth, toggleDeliveryManStatus);
adminRouter.put('/assign-order/:orderId',adminAuth, assignOrderToDelivery);
adminRouter.get('/delivery-location-rules', adminAuth, getDeliveryLocationRules);
adminRouter.put('/delivery-location-rules', adminAuth, updateDeliveryLocationRules);

// Notices
adminRouter.post('/notices/send', adminAuth, sendNoticeEmails);
adminRouter.get('/notices/recent', adminAuth, getRecentNotices);

export default adminRouter;