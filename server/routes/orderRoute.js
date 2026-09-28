import express from 'express';
import { adminAuth } from '../middlewares/adminAuth.js';
import auth from '../middlewares/auth.js';
import { createOrder, createOnlineOrder, verifyOnlinePayment, updateOrderStatus, getMyOrders, cancelOrder, getAllOrders, listCancelRequests, approveCancelRequest, rejectCancelRequest, requestReturn, requestReplace, approveReturn, rejectReturn, approveReplace, rejectReplace } from '../controllers/ordercontroller.js';
 
const orderRouter=express.Router()

//User features
orderRouter.post('/userorders',auth ,getMyOrders);
orderRouter.post('/placeorder', auth, createOrder);
orderRouter.post('/create-online-order', auth, createOnlineOrder);
orderRouter.post('/verify-online-payment', auth, verifyOnlinePayment);
orderRouter.post('/cancel/:id',auth, cancelOrder);
orderRouter.post('/:id/return',auth, requestReturn);
orderRouter.post('/:id/replace',auth, requestReplace);

//Admin features

orderRouter.get('/orders',adminAuth, getAllOrders);
orderRouter.put('/orders/:id',adminAuth, updateOrderStatus);
orderRouter.get('/cancel-requests', adminAuth, listCancelRequests);
orderRouter.put('/cancel-requests/:id/approve', adminAuth, approveCancelRequest);
orderRouter.put('/cancel-requests/:id/reject', adminAuth, rejectCancelRequest);
orderRouter.put('/:id/return/approve',adminAuth, approveReturn);
orderRouter.put('/:id/return/reject',adminAuth, rejectReturn);
orderRouter.put('/:id/replace/approve',adminAuth, approveReplace);
orderRouter.put('/:id/replace/reject',adminAuth, rejectReplace);


export default orderRouter;