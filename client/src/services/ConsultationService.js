import { io } from "socket.io-client";
import api from "./Api.js";

const getSocketBaseUrl = () => {
  const raw = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
};

export const getConsultationSession = (appointmentId) =>
  api.get(`/consultation/appointment/${appointmentId}`);

export const startConsultationSession = (appointmentId) =>
  api.post(`/consultation/appointment/${appointmentId}/start`);

export const endConsultationSession = (appointmentId) =>
  api.post(`/consultation/appointment/${appointmentId}/end`);

export const createConsultationSocket = () => {
  const token = localStorage.getItem("token");
  return io(getSocketBaseUrl(), {
    transports: ["websocket"],
    auth: { token },
  });
};
