import express from 'express';
import {createOrder, updateOrderStatus, getMyOrders, cancelOrder } from '../controllers/orderController.js';
import { adminAuth } from '../middlewares/adminAuth.js';
import auth from '../middlewares/auth.js';

const orderRouter=express.Router()

//Admin features
orderRouter.post('/list',adminAuth, createOrder);
orderRouter.post('/status',adminAuth, updateOrderStatus);

orderRouter.post('/userorders',auth ,getMyOrders);
orderRouter.post('/cancel',auth, cancelOrder);


export default orderRouter;