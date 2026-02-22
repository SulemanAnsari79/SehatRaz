import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Doctor from "../models/doctorModel.js";

const auth = async (req,res,next)=>{
  try{
    const token = req.headers.authorization?.split(" ")[1];
 
    if(!token){
      return res.status(401).json({success:false, message:"Not logged in"});
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decodedToken || !decodedToken.role || !['user', 'doctor', 'admin'].includes(decodedToken.role)) {
          return res.status(403).json({success:false, message: "Access Denied" });
    }
    // console.log("Decoded Token:", decodedToken);
    // For non-admin users, verify they exist in database
    if (decodedToken.role !== "admin") {
      if (decodedToken.role === "user") {
        const user = await User.findById(decodedToken._id);
        if(!user){
          return res.status(401).json({success:false, message:"User not found"});
        }
        req.user = user;
      } else if (decodedToken.role === "doctor") {
        const doctor = await Doctor.findById(decodedToken._id);
        if(!doctor){
          return res.status(401).json({success:false, message:"Doctor not found"});
        }
        req.user = doctor;
      }
    } else {
      // For admin, just set user object with decoded token
      req.user = decodedToken;
    }

    next();
          
  }catch(error){
    res.status(401).json({success:false, message:"Invalid token"});
  }
};

export default auth;