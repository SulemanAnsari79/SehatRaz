import Appointment from '../models/appointmentModel.js';
import Doctor from '../models/doctorModel.js';
import User from '../models/userModel.js';

export const createAppointment = async (req, res) => {
    try {
        const { doctorId, date, time } = req.body;
        const userId = req.user?.id;

        // Validate required fields
        if (!doctorId || !date || !time) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Verify doctor exists and is verified
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        if (!doctor.verified) {
            return res.status(400).json({ success: false, message: 'Doctor not verified' });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if appointment already exists at same time
        const existingAppointment = await Appointment.findOne({
            doctor: doctorId,
            date,
            time
        });

        if (existingAppointment) {
            return res.status(400).json({ success: false, message: 'Appointment slot not available' });
        }

        // Create appointment
        const appointment = new Appointment({
            user: userId,
            doctor: doctorId,
            date,
            time,
            status: 'Booked'
        });

        await appointment.save();

        res.status(201).json({ success: true, message: 'Appointment created successfully', appointment });
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getMyAppointments = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const appointments = await Appointment.find({ user: userId })
            .populate('doctor', '-password')
            .sort({ date: -1 });

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const appointment = await Appointment.findById(id)
            .populate('user')
            .populate('doctor', '-password');

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Verify ownership
        if (appointment.user._id.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        res.status(200).json({ success: true, appointment });
    } catch (error) {
        console.error('Get appointment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Verify ownership
        if (appointment.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        if (appointment.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Appointment already cancelled' });
        }

        appointment.status = 'Cancelled';
        await appointment.save();

        res.status(200).json({ success: true, message: 'Appointment cancelled', appointment });
    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const doctorId = req.user?.id;

        if (!doctorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!['Booked', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('user').populate('doctor', '-password');

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        res.status(200).json({ success: true, message: 'Appointment status updated', appointment });
    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('user', '-password')
            .populate('doctor', '-password')
            .sort({ date: -1 });
        res.status(200).json({ success: true, appointments });
    }
    catch (error) {
        console.error('Get all appointments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        if (!doctorId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const appointments = await Appointment.find({ doctor: doctorId })
            .populate('user', '-password')
            .sort({ date: -1 });

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error('Get doctor appointments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};