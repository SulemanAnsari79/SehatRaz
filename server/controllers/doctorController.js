// import Doctor from '../models/doctorModel.js';
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';

// const createToken = (id, role = "doctor") => {
//     return jwt.sign({ id, role }, process.env.JWT_SECRET)
// }


// export const doctorRegister = async (req, res) => {
//     try {
//         const { name, email, password, specialization, experience, feesPerConsultation, timings } = req.body;
//         const existingDoctor = await Doctor.findOne({ email });
//         if (existingDoctor) {
//             return res.status(400).json({success:flase, message: 'Doctor already exists' });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);
//         const newDoctor = new Doctor({ name, email, password: hashedPassword, specialization, experience, feesPerConsultation, timings });
//         await newDoctor.save();
//         res.status(200).json({success:true, message: 'Doctor registered successfully' });
//     } catch (error) {
//         res.status(500).json({success:false, message: 'Server error' });
//     }
// };

// export const doctorLogin = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         const doctor = await Doctor.findOne({ email });
//         if (!doctor) {
//             return res.status(400).json({success:false, message: 'Invalid credentials' });
//         }

//         const isMatch = await bcrypt.compare(password, doctor.password);
//         if (!isMatch) {
//             return res.status(401).json({success:false, message: 'Invalid email or password' });
//         }

//         const token = createToken(doctor._id, doctor.role || "doctor");

//         res.status(200).json({success:true, message: 'Logged in Successfully', token });

//     } catch (error) {
//         res.status(500).json({success:false, message: 'Server error' });
//     }
// };

// export const doctorLogout = async (req, res) => {
//     try {
//         res.status(200).json({success:true, message: 'Doctor logged out successfully' });
//     } catch (error) {
//         res.status(500).json({success:false, message: 'Server error' });
//     }
// };

import Doctor from '../models/doctorModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const createToken = (id, role = "doctor") => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const doctorRegister = async (req, res) => {
    try {
        const { name, email, password, specialization, experience, feesPerConsultation, timings } = req.body;

        // Validate required fields
        if (!name || !email || !password || !specialization || !experience || !feesPerConsultation || !timings) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({ success: false, message: 'Doctor already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new doctor
        const newDoctor = new Doctor({
            name,
            email,
            password: hashedPassword,
            specialization,
            experience,
            feesPerConsultation,
            timings,
            verified: false
        });

        await newDoctor.save();

        res.status(201).json({ success: true, message: 'Doctor registered successfully. Awaiting admin verification.' });
    } catch (error) {
        console.error('Doctor registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const doctorLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if doctor is verified
        if (!doctor.verified) {
            return res.status(403).json({ success: false, message: 'Your account is pending admin verification' });
        }

        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = createToken(doctor._id, "doctor");

        res.status(200).json({
            success: true,
            message: 'Logged in Successfully',
            token,
            doctor: { _id: doctor._id, name: doctor.name, email: doctor.email, role: "doctor" }
        });
    } catch (error) {
        console.error('Doctor login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const doctorLogout = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'Doctor logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getDoctorProfile = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        if (!doctorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const doctor = await Doctor.findById(doctorId).select('-password');
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        res.status(200).json({ success: true, doctor });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateDoctorProfile = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        if (!doctorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { specialization, experience, feesPerConsultation, timings } = req.body;
        const updateData = {};

        if (specialization) updateData.specialization = specialization;
        if (experience !== undefined && experience > 0) updateData.experience = experience;
        if (feesPerConsultation !== undefined && feesPerConsultation > 0) updateData.feesPerConsultation = feesPerConsultation;
        if (timings && Array.isArray(timings)) updateData.timings = timings;

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({ success: true, message: 'Profile updated successfully', doctor: updatedDoctor });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};