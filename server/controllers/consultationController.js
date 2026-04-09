import jwt from "jsonwebtoken";
import Appointment from "../models/appointmentModel.js";
import OnlineSession from "../models/onlineSessionModel.js";
import ChatMessage from "../models/chatMessageModel.js";

const parseDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;

  const dateMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]) - 1;
  const day = Number(dateMatch[3]);

  let hour = 0;
  let minute = 0;

  const ampmMatch = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    hour = Number(ampmMatch[1]);
    minute = Number(ampmMatch[2]);
    const ampm = ampmMatch[3].toUpperCase();
    if (hour === 12) hour = 0;
    if (ampm === "PM") hour += 12;
  } else {
    const hhmmMatch = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!hhmmMatch) return null;
    hour = Number(hhmmMatch[1]);
    minute = Number(hhmmMatch[2]);
  }

  const dt = new Date(year, month, day, hour, minute, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const getRoleAndIdFromToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return { role: "", userId: "" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = String(decoded?.id || decoded?._id || "");
    return { role: String(decoded?.role || ""), userId };
  } catch {
    return { role: "", userId: "" };
  }
};

const ensureSessionForAppointment = async (appointment) => {
  let session = await OnlineSession.findOne({ appointment: appointment._id });
  if (session) return session;

  session = await OnlineSession.create({
    appointment: appointment._id,
    roomId: `consultation_${appointment._id}`,
    status: appointment.consultationStatus === "live" ? "live" : "scheduled",
  });

  appointment.onlineSessionId = session._id;
  await appointment.save();

  return session;
};

const getJoinWindow = (appointment) => {
  if (appointment.joinWindowStart && appointment.joinWindowEnd) {
    return {
      joinWindowStart: new Date(appointment.joinWindowStart),
      joinWindowEnd: new Date(appointment.joinWindowEnd),
    };
  }

  const start = parseDateTime(appointment.date, appointment.time);
  if (!start) {
    const now = new Date();
    return { joinWindowStart: now, joinWindowEnd: now };
  }

  const joinWindowStart = new Date(start.getTime() - 5 * 60 * 1000);
  const joinWindowEnd = new Date(start.getTime() + 30 * 60 * 1000);
  return { joinWindowStart, joinWindowEnd };
};

const normalizeMessage = (msg) => ({
  _id: msg._id,
  senderRole: msg.senderRole,
  senderId: msg.senderId,
  senderName: msg.senderName,
  messageType: msg.messageType,
  content: msg.content,
  sentAt: msg.sentAt,
});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const getConsultationSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { role, userId } = getRoleAndIdFromToken(req);

    const appointment = await Appointment.findById(appointmentId)
      .populate("user", "name email")
      .populate("doctor", "name email");

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const isUser = role === "user" && String(appointment.user?._id) === userId;
    const isDoctor = role === "doctor" && String(appointment.doctor?._id) === userId;

    if (!isUser && !isDoctor) {
      return res.status(403).json({ success: false, message: "Unauthorized consultation access" });
    }

    if (appointment.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Cancelled appointment consultation is unavailable" });
    }

    if (appointment.mode !== "online") {
      return res.status(400).json({ success: false, message: "This appointment is not configured for online consultation" });
    }

    const session = await ensureSessionForAppointment(appointment);
    const { joinWindowStart, joinWindowEnd } = getJoinWindow(appointment);

    const now = new Date();
    const canJoinNow = appointment.consultationStatus === "live" || (now >= joinWindowStart && now <= joinWindowEnd);

    const recentMessages = await ChatMessage.find({
      appointment: appointment._id,
      sentAt: { $gte: new Date(Date.now() - THIRTY_DAYS_MS) },
    })
      .sort({ sentAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      session: {
        id: session._id,
        roomId: session.roomId,
        status: session.status,
        appointmentId: appointment._id,
        consultationStatus: appointment.consultationStatus,
        mode: appointment.mode,
        date: appointment.date,
        time: appointment.time,
        user: appointment.user,
        doctor: appointment.doctor,
        prescription: session.prescription || "",
        prescriptionUpdatedAt: session.prescriptionUpdatedAt,
        canJoinNow,
        joinWindowStart,
        joinWindowEnd,
      },
      messages: recentMessages.reverse().map(normalizeMessage),
    });
  } catch (error) {
    console.error("Get consultation session error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const startConsultationSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { role, userId } = getRoleAndIdFromToken(req);

    if (role !== "doctor") {
      return res.status(403).json({ success: false, message: "Only doctor can start consultation" });
    }

    const appointment = await Appointment.findById(appointmentId).populate("doctor", "name");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    if (String(appointment.doctor?._id || appointment.doctor) !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized consultation access" });
    }

    const session = await ensureSessionForAppointment(appointment);

    appointment.consultationStatus = "live";
    await appointment.save();

    session.status = "live";
    session.startedAt = session.startedAt || new Date();
    session.lastActivityAt = new Date();
    await session.save();

    return res.status(200).json({ success: true, message: "Consultation session started", session });
  } catch (error) {
    console.error("Start consultation session error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const endConsultationSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { role, userId } = getRoleAndIdFromToken(req);

    if (!["doctor", "user"].includes(role)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("user", "name")
      .populate("doctor", "name");

    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    const isUser = role === "user" && String(appointment.user?._id) === userId;
    const isDoctor = role === "doctor" && String(appointment.doctor?._id) === userId;
    if (!isUser && !isDoctor) {
      return res.status(403).json({ success: false, message: "Unauthorized consultation access" });
    }

    const session = await ensureSessionForAppointment(appointment);

    appointment.consultationStatus = "ended";
    await appointment.save();

    session.status = "ended";
    session.endedAt = new Date();
    session.endedBy = role;
    session.lastActivityAt = new Date();
    await session.save();

    return res.status(200).json({ success: true, message: "Consultation session ended", session });
  } catch (error) {
    console.error("End consultation session error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const saveConsultationPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { role, userId } = getRoleAndIdFromToken(req);
    const prescription = String(req.body?.prescription || "").trim();

    if (role !== "doctor") {
      return res.status(403).json({ success: false, message: "Only doctor can update prescription" });
    }

    const appointment = await Appointment.findById(appointmentId).populate("doctor", "name");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    if (String(appointment.doctor?._id || appointment.doctor) !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized consultation access" });
    }

    const session = await ensureSessionForAppointment(appointment);
    session.prescription = prescription;
    session.prescriptionUpdatedAt = prescription ? new Date() : null;
    session.lastActivityAt = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Prescription saved",
      prescription: session.prescription,
      prescriptionUpdatedAt: session.prescriptionUpdatedAt,
    });
  } catch (error) {
    console.error("Save consultation prescription error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
