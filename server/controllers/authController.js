import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";

const register = async (req,res)=>{
  const {name,email,password} = req.body;

  const userExists = await User.findOne({email});

  if(userExists) return res.status(400).json({message:"User exists"});

  const user = await User.create({name,email,password});

  const token = generateToken(user._id,user.role);

  res.cookie("token",token,{
    httpOnly:true,
    secure:false,
    sameSite:"strict"
  });

  res.json(user);
};

const login = async (req,res)=>{
  const {email,password} = req.body;

  const user = await User.findOne({email});
  if(!user) return res.status(400).json({message:"Invalid credentials"});

  const match = await bcrypt.compare(password,user.password);
  if(!match) return res.status(400).json({message:"Invalid credentials"});

  const token = generateToken(user._id,user.role);

  res.cookie("token",token,{
    httpOnly:true,
    secure:false,
    sameSite:"strict"
  });

  res.json(user);
};

const logout = (req,res)=>{
  res.clearCookie("token");
  res.json({message:"Logged out"});
};

export {register,login,logout};