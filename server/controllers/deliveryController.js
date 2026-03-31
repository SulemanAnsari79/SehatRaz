import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import DeliveryMan from "../models/deliveryManModel.js";
import Order from "../models/orderModel.js";
import DeliveryOtp from "../models/deliveryOtpModel.js";

// ─── Helper: nodemailer transporter ───────────────────────────────────────────
const createTransporter = () =>
  process.env.EMAIL_HOST
    ? nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      })
    : nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

// ─── Login ─────────────────────────────────────────────────────────────────────
export const deliveryLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const deliveryMan = await DeliveryMan.findOne({ email });
    if (!deliveryMan) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, deliveryMan.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!deliveryMan.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    const token = jwt.sign(
      { _id: deliveryMan._id, role: "delivery" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        _id: deliveryMan._id,
        name: deliveryMan.name,
        email: deliveryMan.email,
        phone: deliveryMan.phone,
        role: "delivery",
      },
    });
  } catch (error) {
    console.error("Delivery login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── Get assigned orders ────────────────────────────────────────────────────────
export const getMyAssignedOrders = async (req, res) => {
  try {
    const deliveryManId = req.deliveryMan._id;

    const orders = await Order.find({ assignedTo: deliveryManId })
      .populate("user", "name email")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Get assigned orders error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── Generate OTP for an order (called when delivery man reaches client) ────────
export const generateDeliveryOtp = async (req, res) => {
  try {
    const deliveryManId = req.deliveryMan._id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, assignedTo: deliveryManId }).populate(
      "user",
      "email name"
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ success: false, message: "Order is already delivered" });
    }

    if (!["Shipped", "Out for Delivery"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order must be in Shipped or Out for Delivery status to generate OTP",
      });
    }

    // Invalidate any previous unused OTPs for this order
    await DeliveryOtp.updateMany({ orderId, used: false }, { used: true });

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await DeliveryOtp.create({ orderId, otp, expiresAt });

    // Send OTP to the customer's email
    const recipientEmail = order.shippingDetails?.email || order.user?.email;
    const recipientName = order.shippingDetails?.fullName || order.user?.name || "Customer";

    if (recipientEmail) {
      try {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: recipientEmail,
          subject: "Your Delivery OTP - SehatRazz",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
              <div style="background-color: #4f46e5; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">SehatRazz</h1>
              </div>
              <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #111827;">Delivery OTP</h2>
                <p style="color: #4b5563;">Dear ${recipientName},</p>
                <p style="color: #4b5563;">Your delivery agent has arrived. Please share the following OTP to confirm receipt of your order:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #4f46e5; background: #ede9fe; padding: 16px 32px; border-radius: 12px;">${otp}</span>
                </div>
                <p style="color: #6b7280; font-size: 14px;">This OTP is valid for <strong>15 minutes</strong>. Do not share it with anyone other than the delivery agent at your door.</p>
                <p style="color: #6b7280; font-size: 14px;"><strong>Order ID:</strong> ${order._id}</p>
                <p style="color: #6b7280; font-size: 14px;">Thank you for shopping with SehatRazz!</p>
              </div>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error("OTP email error:", mailErr);
        // Do not fail the request if email fails — OTP is still created
      }
    }

    res.status(200).json({
      success: true,
      message: "OTP generated and sent to customer's email",
    });
  } catch (error) {
    console.error("Generate OTP error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── Verify OTP and mark order as Delivered ──────────────────────────────────────
export const verifyDeliveryOtp = async (req, res) => {
  try {
    const deliveryManId = req.deliveryMan._id;
    const { orderId } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    const order = await Order.findOne({ _id: orderId, assignedTo: deliveryManId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ success: false, message: "Order is already delivered" });
    }

    const otpRecord = await DeliveryOtp.findOne({
      orderId,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP expired or not found. Please generate a new OTP." });
    }

    // Constant-time comparison to prevent timing attacks
    const otpBuffer = Buffer.from(otp);
    const storedBuffer = Buffer.from(otpRecord.otp);
    const isValid =
      otpBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(otpBuffer, storedBuffer);

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // Mark order as Delivered
    const deliveredAt = new Date();
    order.status = "Delivered";
    order.deliveredAt = deliveredAt;
    order.returnDeadlineDate = new Date(deliveredAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    await order.save();

    res.status(200).json({
      success: true,
      message: "OTP verified. Order marked as Delivered.",
      order,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── Get delivery man profile ─────────────────────────────────────────────────
export const getDeliveryProfile = async (req, res) => {
  try {
    res.status(200).json({ success: true, deliveryMan: req.deliveryMan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
