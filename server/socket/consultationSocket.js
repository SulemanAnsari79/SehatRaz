import jwt from "jsonwebtoken";
import Appointment from "../models/appointmentModel.js";
import ChatMessage from "../models/chatMessageModel.js";
import OnlineSession from "../models/onlineSessionModel.js";

const roomName = (appointmentId) => `consultation:${appointmentId}`;

const parseToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  const header = socket.handshake.headers?.authorization;

  if (authToken) return String(authToken).replace(/^Bearer\s+/i, "");
  if (header) return String(header).replace(/^Bearer\s+/i, "");
  return "";
};

const authorizeAppointmentAccess = async ({ appointmentId, userId, role }) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate("user", "name")
    .populate("doctor", "name");

  if (!appointment) return { ok: false, code: "NOT_FOUND" };
  if (appointment.status === "Cancelled") return { ok: false, code: "CANCELLED" };
  if (appointment.mode !== "online") return { ok: false, code: "NOT_ONLINE" };

  const isUser = role === "user" && String(appointment.user?._id) === String(userId);
  const isDoctor = role === "doctor" && String(appointment.doctor?._id) === String(userId);

  if (!isUser && !isDoctor) return { ok: false, code: "FORBIDDEN" };

  let session = await OnlineSession.findOne({ appointment: appointment._id });
  if (!session) {
    session = await OnlineSession.create({
      appointment: appointment._id,
      roomId: `consultation_${appointment._id}`,
      status: appointment.consultationStatus === "live" ? "live" : "scheduled",
      lastActivityAt: new Date(),
    });

    appointment.onlineSessionId = session._id;
    await appointment.save();
  }

  return {
    ok: true,
    appointment,
    session,
    participant: {
      id: String(userId),
      role,
      name: role === "doctor" ? appointment.doctor?.name : appointment.user?.name,
    },
  };
};

export const initConsultationSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = parseToken(socket);
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: String(decoded?.id || decoded?._id || ""),
        role: String(decoded?.role || ""),
      };

      if (!socket.user.id || !["user", "doctor"].includes(socket.user.role)) {
        return next(new Error("Unauthorized"));
      }

      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("consultation:join-room", async ({ appointmentId }, ack) => {
      try {
        const auth = await authorizeAppointmentAccess({
          appointmentId,
          userId: socket.user.id,
          role: socket.user.role,
        });

        if (!auth.ok) {
          ack?.({ success: false, code: auth.code, message: "Unable to join consultation room" });
          return;
        }

        const room = roomName(appointmentId);
        socket.join(room);
        socket.data.appointmentId = String(appointmentId);

        auth.session.lastActivityAt = new Date();
        await auth.session.save();

        socket.to(room).emit("consultation:participant-joined", auth.participant);
        ack?.({ success: true, participant: auth.participant, roomId: auth.session.roomId });
      } catch (error) {
        ack?.({ success: false, message: "Failed to join room" });
      }
    });

    socket.on("consultation:offer", ({ appointmentId, sdp }) => {
      socket.to(roomName(appointmentId)).emit("consultation:offer", {
        from: socket.user,
        sdp,
      });
    });

    socket.on("consultation:answer", ({ appointmentId, sdp }) => {
      socket.to(roomName(appointmentId)).emit("consultation:answer", {
        from: socket.user,
        sdp,
      });
    });

    socket.on("consultation:ice-candidate", ({ appointmentId, candidate }) => {
      socket.to(roomName(appointmentId)).emit("consultation:ice-candidate", {
        from: socket.user,
        candidate,
      });
    });

    socket.on("consultation:chat-send", async ({ appointmentId, content }, ack) => {
      try {
        const text = String(content || "").trim();
        if (!text) {
          ack?.({ success: false, message: "Message is required" });
          return;
        }

        const auth = await authorizeAppointmentAccess({
          appointmentId,
          userId: socket.user.id,
          role: socket.user.role,
        });

        if (!auth.ok) {
          ack?.({ success: false, code: auth.code, message: "Unauthorized" });
          return;
        }

        const message = await ChatMessage.create({
          appointment: auth.appointment._id,
          session: auth.session._id,
          senderRole: socket.user.role,
          senderId: socket.user.id,
          senderName: auth.participant.name || "",
          content: text,
          messageType: "text",
          sentAt: new Date(),
        });

        auth.session.lastActivityAt = new Date();
        await auth.session.save();

        const payload = {
          _id: message._id,
          senderRole: message.senderRole,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          messageType: message.messageType,
          sentAt: message.sentAt,
        };

        io.to(roomName(appointmentId)).emit("consultation:chat-new", payload);
        ack?.({ success: true, message: payload });
      } catch {
        ack?.({ success: false, message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      const appointmentId = socket.data.appointmentId;
      if (!appointmentId) return;
      socket.to(roomName(appointmentId)).emit("consultation:participant-left", {
        id: socket.user?.id,
        role: socket.user?.role,
      });
    });
  });
};
