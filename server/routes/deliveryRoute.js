import express from "express";
import deliveryAuth from "../middlewares/deliveryAuth.js";
import {
  deliveryLogin,
  getMyAssignedOrders,
  generateDeliveryOtp,
  verifyDeliveryOtp,
  markOrderOutForDelivery,
  getDeliveryProfile,
  changeDeliveryPassword,
  deleteDeliveryAccount,
} from "../controllers/deliveryController.js";

const deliveryRouter = express.Router();

// Public
deliveryRouter.post("/login", deliveryLogin);

// Protected (delivery man only)
deliveryRouter.get("/profile", deliveryAuth, getDeliveryProfile);
deliveryRouter.put("/change-password", deliveryAuth, changeDeliveryPassword);
deliveryRouter.delete("/delete-account", deliveryAuth, deleteDeliveryAccount);
deliveryRouter.get("/my-orders", deliveryAuth, getMyAssignedOrders);
deliveryRouter.put("/orders/:orderId/out-for-delivery", deliveryAuth, markOrderOutForDelivery);
deliveryRouter.post("/orders/:orderId/generate-otp", deliveryAuth, generateDeliveryOtp);
deliveryRouter.post("/orders/:orderId/verify-otp", deliveryAuth, verifyDeliveryOtp);

export default deliveryRouter;
