import User from "../models/userModel.js";
import Doctor from "../models/doctorModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import Appointment from "../models/appointmentModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({success:false, message:"Email and password required"});
    }

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ id: "admin", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json({
          success:true,
          message: "Admin logged in successfully",
          token,
          user: { id: "admin", email: email, role: "admin" }
        });
    }
    else{
        res.status(401).json({success:false, message:"Invalid credentials"});
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({success:false, message:"Server error" });
  }
};

export const adminLogout = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: "Admin logged out successfully" });
  }
  catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const adminDashboard = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Welcome Admin"
    });
  } catch (error) {
    res.status(500).json({ success:false, message:"Server error" });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if(!name || !email || !password){
      return res.status(400).json({message:"All fields required"});
    }

    const exist = await User.findOne({ email });
    if(exist){
      return res.status(400).json({message:"User already exists"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({success:true, user});
  } catch (error) {
    res.status(500).json({message:"Failed to create user"});
  }
};

const getAllUsers = async (req,res)=>{
  try{
    const users = await User.find().select("-password");
    res.json(users);
  }catch(err){
    res.status(500).json({message:"Server error"});
  }
};

const getUserById = async (req,res)=>{
  try{
    const user = await User.findById(req.params.id).select("-password");
    if(!user) return res.status(404).json({message:"User not found"});
    res.json(user);
  }catch(err){
    res.status(500).json({message:"Invalid ID"});
  }
};

const updateUser = async (req,res)=>{
  try{
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new:true}
    );
    res.json(user);
  }catch(err){
    res.status(500).json({message:"Update failed"});
  }
};

const deleteUser = async (req,res)=>{
  try{
    await User.findByIdAndDelete(req.params.id);
    res.json({message:"User deleted"});
  }catch(err){
    res.status(500).json({message:"Delete failed"});
  }
};

 const getAllDoctors = async (req,res)=>{
  const doctors = await Doctor.find();
  res.json(doctors);
};

const getDoctorById = async (req,res)=>{
  const doctor = await Doctor.findById(req.params.id);
  if(!doctor) return res.status(404).json({message:"Doctor not found"});
  res.json(doctor);
};

const verifyDoctor = async (req,res)=>{
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { verified:true },
    {new:true}
  );
  res.json({message:"Doctor verified", doctor});
};

const rejectDoctor = async (req,res)=>{
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { verified:false },
    {new:true}
  );
  res.json({message:"Doctor rejected"});
};

const deleteDoctor = async (req,res)=>{
  await Doctor.findByIdAndDelete(req.params.id);
  res.json({message:"Doctor deleted"});
};

// const createProduct = async (req,res)=>{
//   const product = await Product.create(req.body);
//   res.status(201).json(product);
// };

const createProduct = async (req, res) => {
    try {
      const { name, description, price, category, subCategory, sizes, bestSeller } = req.body;

      const images = [];

      if (req.files.image1) images.push(req.files.image1[0]);
      if (req.files.image2) images.push(req.files.image2[0]);
      if (req.files.image3) images.push(req.files.image3[0]);
      if (req.files.image4) images.push(req.files.image4[0]);

      const imagesUrl = await Promise.all(
        images.map(async (item) => {
          const result = await cloudinary.uploader.upload(item.path, {
            resource_type: "image"
          });
          return result.secure_url;
        })
      );
    
      const productData = {
        name,
        description,
        price: Number(price),
        image: imagesUrl,
        sizes: sizes ? JSON.parse(sizes) : [],
        category,
        subCategory,
        bestSeller: bestSeller === "true",
        date: Date.now()
      };
    
      const product = new productModel(productData);
      await product.save();
    
      res.json({ success: true, message: "Product added" });
    
    }catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }

}

const getAllProducts = async (req,res)=>{
  const products = await Product.find();
  res.json(products);
};

const getProductById = async (req,res)=>{
  const product = await Product.findById(req.params.id);
  if(!product) return res.status(404).json({message:"Not found"});
  res.json(product);
};

const updateProduct = async (req,res)=>{
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {new:true}
  );
  res.json(product);
};

const deleteProduct = async (req,res)=>{
  await Product.findByIdAndDelete(req.params.id);
  res.json({message:"Product deleted"});
};

const getAllOrders = async (req,res)=>{
  const orders = await Order.find().populate("user");
  res.json(orders);
};

const getOrderById = async (req,res)=>{
  const order = await Order.findById(req.params.id);
  if(!order) return res.status(404).json({message:"Not found"});
  res.json(order);
};

const updateOrderStatus = async (req,res)=>{
  const { status } = req.body;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    {new:true}
  );

  res.json(order);
};

const deleteOrder = async (req,res)=>{
  await Order.findByIdAndDelete(req.params.id);
  res.json({message:"Order deleted"});
};

const getAllAppointments = async (req,res)=>{
  const appointments = await Appointment.find()
    .populate("user")
    .populate("doctor");

  res.json(appointments);
};

const getAppointmentById = async (req,res)=>{
  const appointment = await Appointment.findById(req.params.id);
  if(!appointment) return res.status(404).json({message:"Not found"});
  res.json(appointment);
};

const updateAppointment = async (req,res)=>{
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    {new:true}
  );
  res.json(appointment);
};

const deleteAppointment = async (req,res)=>{
  await Appointment.findByIdAndDelete(req.params.id);
  res.json({message:"Appointment deleted"});
};

const getAdminStats = async (req,res)=>{
  const users = await User.countDocuments();
  const doctors = await Doctor.countDocuments();
  const products = await Product.countDocuments();
  const orders = await Order.countDocuments();

  res.json({
    users,
    doctors,
    products,
    orders
  });
};


export { adminDashboard,
  createUser,
  getAllUsers,  
  deleteUser,
  updateUser,
  getUserById,
  getAdminStats,
  getAllDoctors,
  getDoctorById,
  verifyDoctor,
  rejectDoctor,
  deleteDoctor,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment
};