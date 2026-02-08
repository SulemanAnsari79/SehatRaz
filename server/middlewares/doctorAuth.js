import jwt from 'jsonwebtoken';
import Doctor from '../models/doctorModel.js';

const doctorAuth = async (req,res,next)=>{
    try{ 
        const token = req.headers.authorization?.split(" ")[1];
        if(!token){
            return res.status(401).json({success:false, message:"Not logged in"});
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        if(!decodedToken || decodedToken.role !== "doctor"){
            return res.status(403).json({success:false, message:"Access denied. Doctors only."});
        }
        
        const doctor = await Doctor.findById(decodedToken.id);
        if(!doctor){
            return res.status(401).json({success:false, message:"Doctor not found"});
        }

        req.doctor = doctor;
        req.user = { id: doctor._id }; // Add user object for compatibility
        next();
    }catch(error){
        res.status(401).json({success:false, message:"Invalid token"});
    }
};

export default doctorAuth;