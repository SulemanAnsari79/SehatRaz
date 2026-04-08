import Doctor from '../models/doctorModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import LeaveRequest from '../models/leaveRequestModel.js';

const toYmd = (dateInput) => {
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const createToken = (id, role = "doctor") => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1D' });
};

export const doctorRegister = async (req, res) => {
    try {
        const { name, email, password, phone, specialization, experience, qualifications } = req.body;

        // Validate required fields
        if (!name || !email || !password || !phone || !specialization || experience === undefined || !qualifications) {
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
            phone,
            specialization,
            experience: parseInt(experience),
            qualifications,
            verified: false
        });

        await newDoctor.save();

        return res.status(200).json({ success: true, message: 'Doctor registered successfully. Awaiting admin verification.' });
    } catch (error) {
        console.error('Doctor registration error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
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

        return res.status(200).json({success: true,message: 'Logged in Successfully',token,doctor: { _id: doctor._id, name: doctor.name, email: doctor.email, role: "doctor" }});
    } catch (error) {
        console.error('Doctor login error:', error);
        return  res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const doctorLogout = async (req, res) => {
    try {
        return res.status(200).json({ success: true, message: 'Doctor logged out successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
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

        return res.status(200).json({ success: true, doctor });
    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
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

        return res.status(200).json({ success: true, message: 'Profile updated successfully', doctor: updatedDoctor });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getVerifiedDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({ verified: true })
            .select('-password -rejectionReason')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, doctors });
    } catch (error) {
        console.error('Get verified doctors error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createLeaveRequest = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        const { date, reason } = req.body;

        if (!doctorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!reason || !String(reason).trim()) {
            return res.status(400).json({ success: false, message: 'Reason is required' });
        }

        const leaveDate = toYmd(date);
        if (!leaveDate) {
            return res.status(400).json({ success: false, message: 'Invalid request date' });
        }

        const today = toYmd(new Date());
        if (leaveDate < today) {
            return res.status(400).json({ success: false, message: 'Requested date cannot be in the past' });
        }

        const existingPending = await LeaveRequest.findOne({
            doctor: doctorId,
            date: leaveDate,
            status: 'Pending'
        });

        if (existingPending) {
            return res.status(400).json({ success: false, message: 'A pending leave request already exists for this date' });
        }

        const created = await LeaveRequest.create({
            doctor: doctorId,
            date: leaveDate,
            reason: String(reason).trim(),
            status: 'Pending'
        });

        return res.status(201).json({
            success: true,
            message: 'Leave request sent to admin successfully',
            request: created
        });
    } catch (error) {
        console.error('Create leave request error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getMyLeaveRequests = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        if (!doctorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const requests = await LeaveRequest.find({ doctor: doctorId })
            .sort({ createdAt: -1 })
            .select('date reason status adminNote reviewedAt createdAt updatedAt');

        return res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error('Get my leave requests error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const changeDoctorPassword = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        if (!doctorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, doctor.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        doctor.password = await bcrypt.hash(newPassword, 10);
        await doctor.save();

        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Doctor change password error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteDoctorAccount = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        if (!doctorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required to delete account' });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Password is incorrect' });
        }

        await Doctor.findByIdAndDelete(doctorId);

        return res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Doctor delete account error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};