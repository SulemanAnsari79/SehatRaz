import mongoose from "mongoose";

const deliveryOtpSchema = new mongoose.Schema({
  orderId:   { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  otp:       { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used:      { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("DeliveryOtp", deliveryOtpSchema);
