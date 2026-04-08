import User from "../models/userModel.js";
import Doctor from "../models/doctorModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import Appointment from "../models/appointmentModel.js";
import DeliveryMan from "../models/deliveryManModel.js";
import Notice from "../models/noticeModel.js";
import LeaveRequest from "../models/leaveRequestModel.js";
import DeliveryLocationRule from "../models/deliveryLocationRuleModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { sendAppointmentRescheduledEmail } from "../utils/appointmentNotifications.js";

const RESCHEDULE_SLOTS = ["11:00 PM", "11:20 PM", "11:40 PM", "12:00 PM"];

const toYmd = (dateInput) => {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addDays = (ymd, days) => {
  const d = new Date(ymd);
  d.setDate(d.getDate() + days);
  return toYmd(d);
};

const parseAppointmentDateTime = (dateStr, timeStr) => {
  const dateMatch = String(dateStr || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(timeStr || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]) - 1;
  const day = Number(dateMatch[3]);
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const ampm = timeMatch[3].toUpperCase();

  if (hour === 12) hour = 0;
  if (ampm === "PM") hour += 12;

  const dt = new Date(year, month, day, hour, minute, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const applyDoctorLeaveAndReschedule = async (doctorId, leaveDate) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return { ok: false, message: "Doctor not found" };
  }

  const leaveSet = new Set((doctor.leaveDates || []).map((d) => toYmd(d)).filter(Boolean));
  leaveSet.add(leaveDate);
  doctor.leaveDates = Array.from(leaveSet).sort();
  await doctor.save();

  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    date: leaveDate,
    status: "Booked",
  })
    .populate("user", "name email")
    .populate("doctor", "name")
    .sort({ createdAt: 1 });

  if (bookedAppointments.length === 0) {
    return { ok: true, shiftedCount: 0, shiftedAppointments: [], leaveDates: doctor.leaveDates };
  }

  const occupancy = new Map();
  const dailyCount = new Map();

  const futureAppointments = await Appointment.find({
    doctor: doctorId,
    status: { $ne: "Cancelled" },
    date: { $gte: addDays(leaveDate, 1) },
  }).select("date time");

  for (const item of futureAppointments) {
    if (!occupancy.has(item.date)) occupancy.set(item.date, new Set());
    occupancy.get(item.date).add(item.time);
    dailyCount.set(item.date, (dailyCount.get(item.date) || 0) + 1);
  }

  const shiftedAppointments = [];

  for (const appointment of bookedAppointments) {
    let candidate = addDays(leaveDate, 1);
    let assigned = null;

    for (let guard = 0; guard < 370; guard += 1) {
      if (leaveSet.has(candidate)) {
        candidate = addDays(candidate, 1);
        continue;
      }

      const count = dailyCount.get(candidate) || 0;
      if (count >= 20) {
        candidate = addDays(candidate, 1);
        continue;
      }

      const usedSlots = occupancy.get(candidate) || new Set();
      const availableSlot = RESCHEDULE_SLOTS.find((slot) => !usedSlots.has(slot));

      if (availableSlot) {
        assigned = { date: candidate, time: availableSlot };
        break;
      }

      candidate = addDays(candidate, 1);
    }

    if (!assigned) {
      return {
        ok: false,
        message:
          "Unable to auto-reschedule all booked appointments. Free up slots or update leave dates.",
      };
    }

    if (!occupancy.has(assigned.date)) occupancy.set(assigned.date, new Set());
    occupancy.get(assigned.date).add(assigned.time);
    dailyCount.set(assigned.date, (dailyCount.get(assigned.date) || 0) + 1);

    const fromDate = appointment.date;
    const fromTime = appointment.time;
    appointment.originalDate = appointment.originalDate || appointment.date;
    appointment.originalTime = appointment.originalTime || appointment.time;
    appointment.date = assigned.date;
    appointment.time = assigned.time;
    appointment.rescheduledByLeave = true;

    if (appointment.mode === "online") {
      const start = parseAppointmentDateTime(assigned.date, assigned.time);
      if (start) {
        appointment.joinWindowStart = new Date(start.getTime() - 10 * 60 * 1000);
        appointment.joinWindowEnd = new Date(start.getTime() + 30 * 60 * 1000);
      }
      appointment.consultationStatus = "scheduled";
    }

    await appointment.save();

    await sendAppointmentRescheduledEmail({
      user: appointment.user,
      doctor: appointment.doctor,
      fromDate,
      fromTime,
      toDate: assigned.date,
      toTime: assigned.time,
    });

    shiftedAppointments.push({
      id: appointment._id,
      fromDate: leaveDate,
      toDate: assigned.date,
      toTime: assigned.time,
    });
  }

  return {
    ok: true,
    shiftedCount: shiftedAppointments.length,
    shiftedAppointments,
    leaveDates: doctor.leaveDates,
  };
};

const createEmailTransporter = () =>
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

const normalizeRecipients = (items = [], type = "") =>
  items
    .filter((item) => item?.email)
    .map((item) => ({
      id: String(item._id),
      name: item.name || "",
      email: item.email,
      type,
    }));

const getRecipientsForGroup = async (group) => {
  if (group === "users") {
    const users = await User.find({ isActive: true }).select("name email");
    return normalizeRecipients(users, "users");
  }

  if (group === "doctors") {
    const doctors = await Doctor.find({}).select("name email");
    return normalizeRecipients(doctors, "doctors");
  }

  if (group === "delivery-men") {
    const deliveryMen = await DeliveryMan.find({ isActive: true }).select("name email");
    return normalizeRecipients(deliveryMen, "delivery-men");
  }

  return [];
};

const getNoticeTargetText = (scope, group, recipientType) => {
  if (scope === "all") return "All recipients";
  if (scope === "group") return `Group: ${group}`;
  if (scope === "individual") return `Individual (${recipientType})`;
  return "Unknown";
};

const normalizeRuleList = (input) => {
  const values = Array.isArray(input)
    ? input
    : String(input || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return Array.from(new Set(values));
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({success:false, message:"Email and password required"});
    }

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ id: "admin", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
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

export const sendNoticeEmails = async (req, res) => {
  try {
    const { scope, group, recipientType, recipientIds, subject, message } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: "Email subject is required" });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Email message is required" });
    }

    if (!["all", "group", "individual"].includes(scope)) {
      return res.status(400).json({ success: false, message: "Invalid scope" });
    }

    let recipients = [];

    if (scope === "all") {
      const [users, doctors, deliveryMen] = await Promise.all([
        getRecipientsForGroup("users"),
        getRecipientsForGroup("doctors"),
        getRecipientsForGroup("delivery-men"),
      ]);
      recipients = [...users, ...doctors, ...deliveryMen];
    }

    if (scope === "group") {
      if (!["users", "doctors", "delivery-men"].includes(group)) {
        return res.status(400).json({ success: false, message: "Invalid group" });
      }
      recipients = await getRecipientsForGroup(group);
    }

    if (scope === "individual") {
      if (!["users", "doctors", "delivery-men"].includes(recipientType)) {
        return res.status(400).json({ success: false, message: "Invalid recipient type" });
      }

      if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
        return res.status(400).json({ success: false, message: "At least one recipient is required" });
      }

      const ids = recipientIds.map((id) => String(id));

      if (recipientType === "users") {
        const users = await User.find({ _id: { $in: ids } }).select("name email");
        recipients = normalizeRecipients(users, "users");
      }

      if (recipientType === "doctors") {
        const doctors = await Doctor.find({ _id: { $in: ids } }).select("name email");
        recipients = normalizeRecipients(doctors, "doctors");
      }

      if (recipientType === "delivery-men") {
        const deliveryMen = await DeliveryMan.find({ _id: { $in: ids } }).select("name email");
        recipients = normalizeRecipients(deliveryMen, "delivery-men");
      }
    }

    const uniqueRecipients = Array.from(
      new Map(recipients.map((recipient) => [recipient.email, recipient])).values()
    );

    if (uniqueRecipients.length === 0) {
      return res.status(404).json({ success: false, message: "No recipients found" });
    }

    const transporter = createEmailTransporter();

    const mailResults = await Promise.allSettled(
      uniqueRecipients.map((recipient) =>
        transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: recipient.email,
          subject: subject.trim(),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #f9fafb; border-radius: 8px; overflow: hidden;">
              <div style="background: #2563eb; padding: 16px 20px; color: #fff;">
                <h2 style="margin: 0; font-size: 20px;">SehatRazz Notice</h2>
              </div>
              <div style="background: #fff; padding: 20px; color: #1f2937; line-height: 1.6;">
                <p style="margin-top: 0;">Hello ${recipient.name || "there"},</p>
                <p style="white-space: pre-wrap;">${message}</p>
                <p style="margin-bottom: 0; color: #6b7280; font-size: 13px;">This is an automated notice from SehatRazz Admin.</p>
              </div>
            </div>
          `,
        })
      )
    );

    const failedRecipients = [];
    mailResults.forEach((result, index) => {
      if (result.status === "rejected") {
        failedRecipients.push({
          email: uniqueRecipients[index].email,
          reason: result.reason?.message || "Failed to send",
        });
      }
    });

    const totalRecipients = uniqueRecipients.length;
    const sentCount = totalRecipients - failedRecipients.length;
    const failedCount = failedRecipients.length;

    await Notice.create({
      subject: subject.trim(),
      message: message.trim(),
      scope,
      group: group || "",
      recipientType: recipientType || "",
      recipientIds: Array.isArray(recipientIds)
        ? recipientIds.map((id) => String(id))
        : [],
      totalRecipients,
      sentCount,
      failedCount,
      createdBy: req.admin?.id || "admin",
    });

    return res.status(200).json({
      success: true,
      message: "Notice email sending completed",
      totalRecipients,
      sentCount,
      failedCount,
      failedRecipients,
    });
  } catch (error) {
    console.error("Send notice emails error:", error);
    return res.status(500).json({ success: false, message: "Failed to send notice emails" });
  }
};

export const getRecentNotices = async (req, res) => {
  try {
    const notices = await Notice.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "subject message scope group recipientType totalRecipients sentCount failedCount createdAt"
      );

    const normalized = notices.map((notice) => ({
      ...notice.toObject(),
      targetText: getNoticeTargetText(
        notice.scope,
        notice.group,
        notice.recipientType
      ),
    }));

    return res.status(200).json({ success: true, notices: normalized });
  } catch (error) {
    console.error("Get recent notices error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch recent notices" });
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
    return res.status(200).json({success: true,message: "Welcome Admin"});
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
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verified: true, rejectionReason: "" },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    res.json({ success: true, message: "Doctor verified", doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to verify doctor" });
  }
};

const rejectDoctor = async (req,res)=>{
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verified: false, rejectionReason: reason.trim() },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    res.json({ success: true, message: "Doctor rejected", doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reject doctor" });
  }
};

const createDoctor = async (req, res) => {
  try {
    const { name, email, password, phone, specialization, experience, qualifications } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !specialization || experience === undefined || !qualifications) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ success: false, message: "Doctor already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new doctor (can be created as verified by admin)
    const newDoctor = new Doctor({
      name,
      email,
      password: hashedPassword,
      phone,
      specialization,
      experience: parseInt(experience),
      qualifications,
      verified: true // Admin-created doctors are verified by default
    });

    await newDoctor.save();

    return res.status(201).json({ success: true, message: "Doctor created successfully", doctor: { ...newDoctor.toObject(), password: undefined } });
  } catch (error) {
    console.error("Create doctor error:", error);
    return res.status(500).json({ success: false, message: "Failed to create doctor" });
  }
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
    const totalDoctors = await Doctor.countDocuments({ verified: true });
    const pendingDoctors = await Doctor.countDocuments({ verified: false });
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
      pendingDoctors,
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


// ─── Delivery Man Management ──────────────────────────────────────────────────

export const createDeliveryMan = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existing = await DeliveryMan.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Delivery man with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const deliveryMan = await DeliveryMan.create({ name, email, password: hashedPassword, phone });

    res.status(201).json({ success: true, message: "Delivery man created", deliveryMan: { ...deliveryMan.toObject(), password: undefined } });
  } catch (error) {
    console.error("Create delivery man error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllDeliveryMen = async (req, res) => {
  try {
    const deliveryMen = await DeliveryMan.find().select("-password");
    res.status(200).json({ success: true, deliveryMen });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteDeliveryMan = async (req, res) => {
  try {
    await DeliveryMan.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Delivery man deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const toggleDeliveryManStatus = async (req, res) => {
  try {
    const dm = await DeliveryMan.findById(req.params.id);
    if (!dm) return res.status(404).json({ success: false, message: "Not found" });
    dm.isActive = !dm.isActive;
    await dm.save();
    res.status(200).json({ success: true, message: `Delivery man ${dm.isActive ? "activated" : "deactivated"}`, isActive: dm.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getDeliveryLocationRules = async (req, res) => {
  try {
    const rules = await DeliveryLocationRule.findOne({ singletonKey: "global" });

    return res.status(200).json({
      success: true,
      rules: {
        isEnabled: rules?.isEnabled || false,
        allowedCities: rules?.allowedCities || [],
        allowedStates: rules?.allowedStates || [],
        allowedCountries: rules?.allowedCountries || [],
        allowedPincodes: rules?.allowedPincodes || [],
      },
    });
  } catch (error) {
    console.error("Get delivery location rules error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch delivery location rules" });
  }
};

export const updateDeliveryLocationRules = async (req, res) => {
  try {
    const payload = req.body || {};
    const allowedCities = normalizeRuleList(payload.allowedCities);
    const allowedStates = normalizeRuleList(payload.allowedStates);
    const allowedCountries = normalizeRuleList(payload.allowedCountries);
    const allowedPincodes = normalizeRuleList(payload.allowedPincodes).map((item) => String(item).replace(/\D/g, ""));

    const hasAnyRule =
      allowedCities.length > 0 ||
      allowedStates.length > 0 ||
      allowedCountries.length > 0 ||
      allowedPincodes.length > 0;

    const isEnabled =
      typeof payload.isEnabled === "boolean"
        ? payload.isEnabled
        : hasAnyRule;

    const rules = await DeliveryLocationRule.findOneAndUpdate(
      { singletonKey: "global" },
      {
        singletonKey: "global",
        isEnabled,
        allowedCities,
        allowedStates,
        allowedCountries,
        allowedPincodes,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Delivery location rules updated",
      rules,
    });
  } catch (error) {
    console.error("Update delivery location rules error:", error);
    return res.status(500).json({ success: false, message: "Failed to update delivery location rules" });
  }
};

export const assignOrderToDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryManId } = req.body;

    if (!deliveryManId) {
      return res.status(400).json({ success: false, message: "deliveryManId is required" });
    }

    const dm = await DeliveryMan.findById(deliveryManId);
    if (!dm) return res.status(404).json({ success: false, message: "Delivery man not found" });

    const order = await Order.findByIdAndUpdate(
      orderId,
      { assignedTo: deliveryManId, status: "Out for Delivery" },
      { new: true }
    ).populate("assignedTo", "name email phone");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.status(200).json({ success: true, message: "Order assigned and status set to Out for Delivery", order });
  } catch (error) {
    console.error("Assign order error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getLeaveRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (["Pending", "Approved", "Rejected"].includes(status)) {
      filter.status = status;
    }

    const requests = await LeaveRequest.find(filter)
      .populate("doctor", "name email specialization")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("Get leave requests error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leave requests" });
  }
};

export const approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote = "" } = req.body || {};

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Only pending requests can be approved" });
    }

    const leaveDate = toYmd(request.date);
    if (!leaveDate) {
      return res.status(400).json({ success: false, message: "Invalid leave request date" });
    }

    const applyResult = await applyDoctorLeaveAndReschedule(request.doctor, leaveDate);
    if (!applyResult.ok) {
      return res.status(400).json({ success: false, message: applyResult.message });
    }

    request.status = "Approved";
    request.adminNote = String(adminNote || "").trim();
    request.reviewedBy = req.admin?.id || "admin";
    request.reviewedAt = new Date();
    await request.save();

    return res.status(200).json({
      success: true,
      message: `Leave approved and ${applyResult.shiftedCount} appointments shifted`,
      request,
      shiftedCount: applyResult.shiftedCount,
      shiftedAppointments: applyResult.shiftedAppointments,
    });
  } catch (error) {
    console.error("Approve leave request error:", error);
    return res.status(500).json({ success: false, message: "Failed to approve leave request" });
  }
};

export const rejectLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote = "" } = req.body || {};

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Only pending requests can be rejected" });
    }

    request.status = "Rejected";
    request.adminNote = String(adminNote || "").trim();
    request.reviewedBy = req.admin?.id || "admin";
    request.reviewedAt = new Date();
    await request.save();

    return res.status(200).json({ success: true, message: "Leave request rejected", request });
  } catch (error) {
    console.error("Reject leave request error:", error);
    return res.status(500).json({ success: false, message: "Failed to reject leave request" });
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
  createDoctor,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
 };