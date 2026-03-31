import jwt from "jsonwebtoken";
import DeliveryMan from "../models/deliveryManModel.js";

const deliveryAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || decoded.role !== "delivery") {
      return res.status(403).json({ success: false, message: "Access denied. Delivery men only." });
    }

    const deliveryMan = await DeliveryMan.findById(decoded._id).select("-password");
    if (!deliveryMan) {
      return res.status(401).json({ success: false, message: "Delivery man not found" });
    }

    req.deliveryMan = deliveryMan;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default deliveryAuth;
