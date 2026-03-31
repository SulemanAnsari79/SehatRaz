import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary';

const createToken = (id, role = "user") => {
    return jwt.sign({ _id: id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Basic email validation
        if (!email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password with salt rounds
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = createToken(user._id, "user");
         
        res.status(200).json
        ({
            success: true,
            message: 'Logged in successfully',
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: "user" }
        });
    } catch (error) {
        // console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const logout = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'User logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createUser = async (req, res) => {
    try {
        const { name, email, password, role, address, phone, city, state, zipCode } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }
        if (!email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role: role || 'user', address, phone, city, state, zipCode });
        await newUser.save();
        res.status(201).json({ success: true, message: 'User created successfully', user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { name, address, phone, city, state, zipCode } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (address) updateData.address = address;
        if (phone) updateData.phone = phone;
        if (city) updateData.city = city;
        if (state) updateData.state = state;
        if (zipCode) updateData.zipCode = zipCode;

        const updatedUser = await User.findByIdAndUpdate(userId, updateData,{ new: true, runValidators: true }).select('-password');

        res.status(200).json({ success: true, message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const uploadProfileImage = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        // Upload image to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'sehatrazz/profiles',
                resource_type: 'auto'
            },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return res.status(500).json({ success: false, message: 'Failed to upload image' });
                }

                try {
                    // Update user with image URL
                    const updatedUser = await User.findByIdAndUpdate(
                        userId,
                        { image: result.secure_url },
                        { new: true }
                    ).select('-password');

                    res.status(200).json({
                        success: true,
                        message: 'Profile image uploaded successfully',
                        image: result.secure_url,
                        user: updatedUser
                    });
                } catch (dbError) {
                    console.error('Database update error:', dbError);
                    res.status(500).json({ success: false, message: 'Failed to save image URL' });
                }
            }
        );

        // End stream with buffer
        uploadStream.end(req.file.buffer);
    } catch (error) {
        console.error('Upload profile image error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllUsers = async (req,res)=>{
  try{
    const users = await User.find().select("-password");
    res.json(users);
  }catch(err){
    res.status(500).json({message:"Server error"});
  }
};

export const updateUser = async (req,res)=>{
  try{
    const { name, email, phone, address, city, state, zipCode, role, isActive } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (zipCode) updateData.zipCode = zipCode;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {new: true, runValidators: true}
    );
    res.status(200).json({ success: true, message: 'User updated successfully', user });
  }catch(err){
    console.error('Update user error:', err);
    res.status(500).json({success: false, message:"Update failed"});
  }
};

export const deleteUser = async (req,res)=>{
  try{
    await User.findByIdAndDelete(req.params.id);
    res.json({message:"User deleted"});
  }catch(err){
    res.status(500).json({message:"Delete failed"});
  }
};

export const changePassword = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();
        res.status(200).json({ success: true, message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required to delete account' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Password is incorrect' });
        }
        await User.findByIdAndDelete(userId);
        res.status(200).json({ success: true, message: 'Account deleted successfully' });
    }
    catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const sendForgotPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with this email' });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({
                success: false,
                message: 'Email service is not configured. Please set EMAIL_USER and EMAIL_PASS in server .env'
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.forgotPasswordOtp = otp;
        user.forgotPasswordOtpExpiry = otpExpiry;
        user.forgotPasswordOtpVerified = false;
        await user.save();

        const transporter = process.env.EMAIL_HOST
            ? nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT) || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            })
            : nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: 'SehatRazz Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4f46e5;">Password Reset OTP</h2>
                    <p>Your OTP for resetting your SehatRazz account password is:</p>
                    <h1 style="letter-spacing: 6px; color: #111827;">${otp}</h1>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        });

        res.status(200).json({ success: true, message: 'OTP sent to your email successfully' });
    } catch (error) {
        console.error('Send forgot password OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
};

export const verifyForgotPasswordOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.forgotPasswordOtp || !user.forgotPasswordOtpExpiry) {
            return res.status(400).json({ success: false, message: 'Please request OTP first' });
        }

        if (user.forgotPasswordOtpExpiry < new Date()) {
            user.forgotPasswordOtp = '';
            user.forgotPasswordOtpExpiry = null;
            user.forgotPasswordOtpVerified = false;
            await user.save();
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP' });
        }

        if (user.forgotPasswordOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        user.forgotPasswordOtpVerified = true;
        await user.save();

        res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Verify forgot password OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
};

export const resetPasswordWithOtp = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.forgotPasswordOtpVerified) {
            return res.status(400).json({ success: false, message: 'Please verify OTP before resetting password' });
        }

        if (!user.forgotPasswordOtpExpiry || user.forgotPasswordOtpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP verification has expired. Please start again' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.forgotPasswordOtp = '';
        user.forgotPasswordOtpExpiry = null;
        user.forgotPasswordOtpVerified = false;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successfully. Please login with your new password' });
    } catch (error) {
        console.error('Reset password with OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};