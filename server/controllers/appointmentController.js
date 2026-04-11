import Appointment from '../models/appointmentModel.js';
import Doctor from '../models/doctorModel.js';
import User from '../models/userModel.js';
import OnlineSession from '../models/onlineSessionModel.js';
import crypto from 'crypto';
import { getRazorpayInstance, getRazorpayKeyId } from '../config/razorpay.js';
import {
    sendAppointmentBookedEmail,
    sendAppointmentCancelledByAdminEmail,
} from '../utils/appointmentNotifications.js';

const normalizeDateWindow = (rawDate) => {
    const selectedDate = new Date(rawDate);
    if (Number.isNaN(selectedDate.getTime())) {
        return { ok: false, message: 'Invalid date format' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);

    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 1);

    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < minDate || selectedDate > maxDate) {
        return { ok: false, message: 'Appointments can be booked from today up to one month only' };
    }

    return { ok: true };
};

const validateAppointmentSlot = async ({ doctorId, date, time }) => {
    const doctor = await Doctor.findById(doctorId).select('leaveDates');
    const leaveSet = new Set((doctor?.leaveDates || []).map((d) => String(d)));
    if (leaveSet.has(String(date))) {
        return { ok: false, message: 'Doctor is on leave for the selected date' };
    }

    const existingAppointment = await Appointment.findOne({
        doctor: doctorId,
        date,
        time,
        status: { $ne: 'Cancelled' }
    });

    if (existingAppointment) {
        return { ok: false, message: 'Appointment slot not available' };
    }

    const dailyCount = await Appointment.countDocuments({
        doctor: doctorId,
        date,
        status: { $ne: 'Cancelled' }
    });

    if (dailyCount >= 20) {
        return { ok: false, message: 'This doctor is fully booked for the selected date' };
    }

    return { ok: true };
};

const parseAppointmentDateTime = (dateStr, timeStr) => {
    const dateMatch = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) return null;

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]) - 1;
    const day = Number(dateMatch[3]);

    let hour = 0;
    let minute = 0;
    const ampmMatch = String(timeStr || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampmMatch) {
        hour = Number(ampmMatch[1]);
        minute = Number(ampmMatch[2]);
        const ampm = ampmMatch[3].toUpperCase();
        if (hour === 12) hour = 0;
        if (ampm === 'PM') hour += 12;
    } else {
        const hhmmMatch = String(timeStr || '').trim().match(/^(\d{1,2}):(\d{2})$/);
        if (!hhmmMatch) return null;
        hour = Number(hhmmMatch[1]);
        minute = Number(hhmmMatch[2]);
    }

    const dt = new Date(year, month, day, hour, minute, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
};

const sanitizeAdminText = (value, max = 500) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

const getAppointmentRefundPolicy = (appointment) => {
    const amount = Number(appointment?.amount || 0);
    if (amount <= 0) {
        return {
            eligible: false,
            status: 'None',
            policyTier: 'none',
            policyPercent: 0,
            policyReason: 'No paid amount available for refund',
            refundAmount: 0,
        };
    }

    if (String(appointment?.paymentStatus || '') !== 'Paid') {
        return {
            eligible: false,
            status: 'None',
            policyTier: 'none',
            policyPercent: 0,
            policyReason: 'Refund is only available for paid appointments',
            refundAmount: 0,
        };
    }

    const slotStart = parseAppointmentDateTime(appointment?.date, appointment?.time);
    if (!slotStart) {
        return {
            eligible: false,
            status: 'None',
            policyTier: 'none',
            policyPercent: 0,
            policyReason: 'Unable to calculate appointment start time for refund policy',
            refundAmount: 0,
        };
    }

    const hoursBeforeStart = (slotStart.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursBeforeStart < 2) {
        return {
            eligible: false,
            status: 'Rejected',
            policyTier: 'none',
            policyPercent: 0,
            policyReason: 'Cancellations within 2 hours are not refundable',
            refundAmount: 0,
        };
    }

    if (hoursBeforeStart < 24) {
        const refundAmount = Math.round(amount * 0.5 * 100) / 100;
        return {
            eligible: true,
            status: 'PendingApproval',
            policyTier: 'partial',
            policyPercent: 50,
            policyReason: 'Cancelled between 2 and 24 hours before appointment',
            refundAmount,
        };
    }

    return {
        eligible: true,
        status: 'PendingApproval',
        policyTier: 'full',
        policyPercent: 100,
        policyReason: 'Cancelled 24 or more hours before appointment',
        refundAmount: Math.round(amount * 100) / 100,
    };
};

const applyCancellationAndRefundPolicy = (appointment, { actor, reason }) => {
    appointment.status = 'Cancelled';
    appointment.cancelledBy = actor;
    appointment.cancelledAt = new Date();
    appointment.cancelReason = sanitizeAdminText(reason || `${actor} requested cancellation`, 300);

    const policy = getAppointmentRefundPolicy(appointment);
    appointment.refundControl = {
        ...(appointment.refundControl || {}),
        eligible: policy.eligible,
        policyTier: policy.policyTier,
        policyPercent: policy.policyPercent,
        policyReason: policy.policyReason,
        status: policy.status,
        requestedAt: policy.status === 'PendingApproval' ? new Date() : null,
        amount: policy.refundAmount,
        adminNotes: policy.policyReason,
        decidedBy: '',
        decisionAt: policy.status === 'Rejected' ? new Date() : null,
        refundedAt: null,
        gateway: '',
        gatewayRefundId: '',
        failureReason: '',
    };

    if (policy.status === 'PendingApproval') {
        appointment.paymentStatus = 'Refund Pending';
    }

    if (policy.status === 'Rejected') {
        appointment.paymentStatus = 'Refund Rejected';
    }
};

const attachOnlineSessionIfNeeded = async (appointment) => {
    if (appointment.mode !== 'online') return;

    const startTime = parseAppointmentDateTime(appointment.date, appointment.time);
    if (startTime) {
        appointment.joinWindowStart = new Date(startTime.getTime() - 5 * 60 * 1000);
        appointment.joinWindowEnd = new Date(startTime.getTime() + 30 * 60 * 1000);
    }
    appointment.consultationStatus = 'scheduled';
    await appointment.save();

    const existingSession = await OnlineSession.findOne({ appointment: appointment._id });
    if (existingSession) {
        appointment.onlineSessionId = existingSession._id;
        await appointment.save();
        return;
    }

    const session = await OnlineSession.create({
        appointment: appointment._id,
        roomId: `consultation_${appointment._id}`,
        status: 'scheduled',
    });

    appointment.onlineSessionId = session._id;
    await appointment.save();
};

export const createAppointment = async (req, res) => {
    try {
        const { doctorId, date, time, comment = '', mode = 'in_person' } = req.body;
        const userId = req.user?.id;

        // Validate required fields
        if (!doctorId || !date || !time) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const dateWindow = normalizeDateWindow(date);
        if (!dateWindow.ok) {
            return res.status(400).json({ success: false, message: dateWindow.message });
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
        const slotValidation = await validateAppointmentSlot({ doctorId, date, time });
        if (!slotValidation.ok) {
            return res.status(400).json({ success: false, message: slotValidation.message });
        }

        // Create appointment
        const appointment = new Appointment({
            user: userId,
            doctor: doctorId,
            mode: mode === 'online' ? 'online' : 'in_person',
            date,
            time,
            comment,
            status: 'Booked',
            consultationStatus: 'scheduled',
            paymentStatus: 'Paid',
            amount: Number(doctor.feesPerConsultation || 0),
            paidAt: new Date()
        });

        await appointment.save();
        await attachOnlineSessionIfNeeded(appointment);

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('user', 'name email')
            .populate('doctor', 'name');

        await sendAppointmentBookedEmail({
            user: populatedAppointment?.user,
            doctor: populatedAppointment?.doctor,
            appointment: populatedAppointment,
        });

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
            .sort({ createdAt: -1, date: -1, time: -1 });

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
        const reason = sanitizeAdminText(req.body?.reason, 300);

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

        applyCancellationAndRefundPolicy(appointment, {
            actor: 'user',
            reason,
        });
        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Appointment cancelled. Refund policy has been evaluated.',
            appointment,
            refund: appointment.refundControl,
        });
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
            .sort({ createdAt: -1, date: -1, time: -1 });
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
            .sort({ createdAt: -1, date: -1, time: -1 });

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error('Get doctor appointments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getDoctorAvailability = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ success: false, message: 'doctorId and date are required' });
        }

        const selectedDate = new Date(date);
        if (Number.isNaN(selectedDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }

        const doctor = await Doctor.findById(doctorId).select('verified leaveDates');
        if (!doctor || !doctor.verified) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const isLeaveDate = new Set((doctor.leaveDates || []).map((d) => String(d))).has(String(date));

        if (isLeaveDate) {
            return res.status(200).json({
                success: true,
                doctorId,
                date,
                totalBookings: 20,
                maxPerDay: 20,
                isDateFull: true,
                isLeaveDate: true,
                bookedSlots: []
            });
        }

        const appointments = await Appointment.find({
            doctor: doctorId,
            date,
            status: { $ne: 'Cancelled' }
        }).select('time');

        const bookedSlots = appointments.map((item) => item.time);
        const totalBookings = appointments.length;

        return res.status(200).json({
            success: true,
            doctorId,
            date,
            totalBookings,
            maxPerDay: 20,
            isDateFull: totalBookings >= 20,
            isLeaveDate: false,
            bookedSlots
        });
    } catch (error) {
        console.error('Get doctor availability error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createAppointmentPaymentOrder = async (req, res) => {
    try {
        const { doctorId, date, time, comment = '', mode = 'in_person' } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!doctorId || !date || !time) {
            return res.status(400).json({ success: false, message: 'doctorId, date, and time are required' });
        }

        const dateWindow = normalizeDateWindow(date);
        if (!dateWindow.ok) {
            return res.status(400).json({ success: false, message: dateWindow.message });
        }

        const doctor = await Doctor.findById(doctorId).select('name verified feesPerConsultation');
        if (!doctor || !doctor.verified) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const slotValidation = await validateAppointmentSlot({ doctorId, date, time });
        if (!slotValidation.ok) {
            return res.status(400).json({ success: false, message: slotValidation.message });
        }

        const amount = Number(doctor.feesPerConsultation || 0);
        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Doctor consultation fee is not configured' });
        }

        const razorpay = getRazorpayInstance();
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `appt_${Date.now()}`,
            notes: {
                userId: String(userId),
                doctorId: String(doctorId),
                date,
                time,
                mode: String(mode === 'online' ? 'online' : 'in_person'),
                comment: String(comment || '').slice(0, 500)
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Appointment payment order created',
            keyId: getRazorpayKeyId(),
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            booking: {
                doctorId,
                doctorName: doctor.name,
                date,
                time,
                mode: mode === 'online' ? 'online' : 'in_person',
                comment: String(comment || '').slice(0, 500)
            }
        });
    } catch (error) {
        console.error('Create appointment payment order error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const verifyAppointmentPayment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            doctorId,
            date,
            time,
            mode = 'in_person',
            comment = '',
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!doctorId || !date || !time || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ success: false, message: 'Razorpay secret not configured' });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        const receivedBuffer = Buffer.from(String(razorpay_signature));
        const expectedBuffer = Buffer.from(String(expectedSignature));

        const isValidSignature =
            receivedBuffer.length === expectedBuffer.length &&
            crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

        if (!isValidSignature) {
            return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
        }

        const dateWindow = normalizeDateWindow(date);
        if (!dateWindow.ok) {
            return res.status(400).json({ success: false, message: dateWindow.message });
        }

        const doctor = await Doctor.findById(doctorId).select('verified feesPerConsultation');
        if (!doctor || !doctor.verified) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const slotValidation = await validateAppointmentSlot({ doctorId, date, time });
        if (!slotValidation.ok) {
            return res.status(400).json({ success: false, message: slotValidation.message });
        }

        const appointment = new Appointment({
            user: userId,
            doctor: doctorId,
            mode: mode === 'online' ? 'online' : 'in_person',
            date,
            time,
            comment,
            status: 'Booked',
            consultationStatus: 'scheduled',
            paymentStatus: 'Paid',
            amount: Number(doctor.feesPerConsultation || 0),
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paidAt: new Date()
        });

        await appointment.save();
    await attachOnlineSessionIfNeeded(appointment);

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('user', 'name email')
            .populate('doctor', 'name');

        await sendAppointmentBookedEmail({
            user: populatedAppointment?.user,
            doctor: populatedAppointment?.doctor,
            appointment: populatedAppointment,
        });

        return res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            appointment
        });
    } catch (error) {
        console.error('Verify appointment payment error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export const getMyBookedAppointments = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const appointments = await Appointment.find({
            user: userId,
            status: { $in: ['Booked', 'Completed'] }
        })
            .populate('doctor', '-password')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error('Get my booked appointments error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createAppointmentAsAdmin = async (req, res) => {
    try {
        const { userId, doctorId, date, time, comment = '', status = 'Booked', mode = 'in_person' } = req.body;

        // Validate required fields
        if (!userId || !doctorId || !date || !time) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Verify doctor exists and is verified
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create appointment without date window validation for admin
        const appointment = new Appointment({
            user: userId,
            doctor: doctorId,
            mode: mode === 'online' ? 'online' : 'in_person',
            date,
            time,
            comment,
            status: status || 'Booked',
            consultationStatus: 'scheduled',
            paymentStatus: 'Paid',
            amount: Number(doctor.feesPerConsultation || 0),
            paidAt: new Date()
        });

        await appointment.save();
        await attachOnlineSessionIfNeeded(appointment);

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('user', '-password')
            .populate('doctor', '-password');

        await sendAppointmentBookedEmail({
            user: populatedAppointment?.user,
            doctor: populatedAppointment?.doctor,
            appointment: populatedAppointment,
        });

        res.status(201).json({ 
            success: true, 
            message: 'Appointment created successfully by admin', 
            appointment: populatedAppointment 
        });
    } catch (error) {
        console.error('Create appointment as admin error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const cancelAppointmentAsAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const reason = sanitizeAdminText(req.body?.reason, 300);

        const appointment = await Appointment.findById(id)
            .populate('user', 'name email')
            .populate('doctor', 'name');

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointment.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Appointment already cancelled' });
        }

        applyCancellationAndRefundPolicy(appointment, {
            actor: 'admin',
            reason,
        });
        await appointment.save();

        await sendAppointmentCancelledByAdminEmail({
            user: appointment.user,
            doctor: appointment.doctor,
            appointment,
        });

        return res.status(200).json({
            success: true,
            message: 'Appointment cancelled by admin. Refund policy has been evaluated.',
            appointment,
            refund: appointment.refundControl,
        });
    } catch (error) {
        console.error('Cancel appointment by admin error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateAppointmentStatusAsAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Booked', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('user', '-password').populate('doctor', '-password');

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        return res.status(200).json({ success: true, message: 'Appointment status updated', appointment });
    } catch (error) {
        console.error('Admin update appointment error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};