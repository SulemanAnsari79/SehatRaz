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

const getUserById = async (req,res)=>{
  try{
    const user = await User.findById(req.params.id).select("-password");
    if(!user) return res.status(404).json({message:"User not found"});
    res.json(user);
  }catch(err){
    res.status(500).json({message:"Invalid ID"});
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
      const { name, description, price, category, sizes, bestSeller, stock } = req.body;

      // Validate required fields
      if (!name || !description || !price || !category || !stock) {
        return res.status(400).json({ success: false, message: 'Name, description, price, category, and stock are required' });
      }

      if (price <= 0 || stock < 0) {
        return res.status(400).json({ success: false, message: 'Invalid price or stock value' });
      }

      const images = [];

      if (req.files.image1) images.push(req.files.image1[0]);
      if (req.files.image2) images.push(req.files.image2[0]);
      if (req.files.image3) images.push(req.files.image3[0]);
      if (req.files.image4) images.push(req.files.image4[0]);

      if (images.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one product image is required' });
      }

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
        stock: Number(stock),
        images: imagesUrl,
        sizes: sizes ? JSON.parse(sizes) : [],
        category,
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
  try {
    const totalUsers = await User.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Calculate total revenue from all orders
    const orders = await Order.find({});
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: { $in: ['Booked', 'Pending'] } });

    res.json({
      success: true,
      totalUsers,
      totalDoctors,
      totalOrders,
      totalRevenue,
      totalAppointments,
      pendingAppointments
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export { adminDashboard,
  createUser,
  // getAllUsers,  
  // deleteUser,
  // updateUser,
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