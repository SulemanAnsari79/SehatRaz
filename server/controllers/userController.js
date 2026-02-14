// import User from '../models/userModel.js';
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';

// const createToken = (id, role = "user") => {
//   return jwt.sign({ id, role }, process.env.JWT_SECRET)
// }

// export const register = async (req, res) => {
//     try {
//         const { name, email, password } = req.body;

//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({success:false, message: 'User already exists' });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);
//         const newUser = new User({ name, email, password: hashedPassword });
//         await newUser.save();

//         res.status(200).json({success:true, message: 'User registered successfully' });
//     } catch (error) {
//         res.status(500).json({success:false, message: 'Server error' });
//     }
// };

// export const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         const user = await User.findOne({ email });

//         if (!user) {
//             return res.status(400).json({success:false, message: 'Invalid credentials' });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);

//         if (!isMatch) {
//             return res.status(401).json({success: false,message: "Invalid email or password"});
//         }

//         const token = createToken(user._id, user.role || "user" );
//         res.status(200).json({success:true,message:"Logged in Successfully", token });
//     } catch (error) {
//         res.status(500).json({success:false, message: 'Server error' });
//     }
// };

// export const logout = async (req, res) => {
//     try {
//         res.status(200).json({success:true, message: 'User logged out successfully' });
//     } catch (error) {
//         res.status(500).json({success:false, message: 'Server error' });
//     }
// };
 
import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const createToken = (id, role = "user") => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
         
        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: "user" }
        });
    } catch (error) {
        console.error('Login error:', error);
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
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { name, address, phone } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (address) updateData.address = address;
        if (phone) updateData.phone = phone;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({ success: true, message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};