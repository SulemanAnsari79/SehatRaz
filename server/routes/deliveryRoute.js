import express from "express";
import deliveryAuth from "../middlewares/deliveryAuth.js";
import {
  deliveryLogin,
  getMyAssignedOrders,
  generateDeliveryOtp,
  verifyDeliveryOtp,
  getDeliveryProfile,
} from "../controllers/deliveryController.js";

const deliveryRouter = express.Router();

// Public
deliveryRouter.post("/login", deliveryLogin);

// Protected (delivery man only)
deliveryRouter.get("/profile", deliveryAuth, getDeliveryProfile);
deliveryRouter.get("/my-orders", deliveryAuth, getMyAssignedOrders);
deliveryRouter.post("/orders/:orderId/generate-otp", deliveryAuth, generateDeliveryOtp);
deliveryRouter.post("/orders/:orderId/verify-otp", deliveryAuth, verifyDeliveryOtp);

export default deliveryRouter;
