import jwt from "jsonwebtoken";

export const adminAuth = async (req,res,next)=>{
    try{
        const token = req.headers.authorization?.split(" ")[1];

        if(!token){
            return res.status(401).json({success:false, message:"Not logged in"});
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        if(!decodedToken || decodedToken.role !== "admin"){
            return res.status(403).json({success:false, message:"Access denied. Admins only."});
        }
        
        req.admin = decodedToken;
        next();
    }catch(error){
        res.status(401).json({success:false, message:"Invalid token"});
    }
};

export default adminAuth;