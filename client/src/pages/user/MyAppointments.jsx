import { useCallback, useEffect, useState } from "react";
import { FiCalendar, FiClock, FiLoader, FiUser, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { getMyBookedAppointments } from "../../services/DoctorService.js";
import api from "../../services/Api.js";

const MyAppointments = () => {
  const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const canCancelAppointment = (appointmentDate) => {
      const appointment = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
    
      const timeDifference = appointment.getTime() - today.getTime();
      const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
    
      return daysDifference >= 1;
    };

    const handleCancelAppointment = async (appointmentId) => {
      if (!window.confirm("Are you sure you want to cancel this appointment?")) {
        return;
      }

      try {
        await api.delete(`/appointment/cancel/${appointmentId}`);
        setAppointments(appointments.filter((apt) => apt._id !== appointmentId));
        toast.success("Appointment cancelled successfully");
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to cancel appointment");
      }
    };
  const extractAppointments = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.appointments)) return payload.appointments;
    if (payload && typeof payload === "object") {
      const key = Object.keys(payload).find((item) => Array.isArray(payload[item]));
      return key ? payload[key] : [];
    }
    return [];
  };

  const parseAppointmentDateTime = (dateStr, timeStr) => {
    const dateMatch = String(dateStr || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) return null;

    const ampmMatch = String(timeStr || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!ampmMatch) return null;

    let hour = Number(ampmMatch[1]);
    const minute = Number(ampmMatch[2]);
    const ampm = ampmMatch[3].toUpperCase();

    if (hour === 12) hour = 0;
    if (ampm === "PM") hour += 12;

    const dt = new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]), hour, minute, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  const canJoinConsultationNow = (appointment) => {
    if (appointment.mode !== "online") return false;
    if (!String(appointment.status || "").toLowerCase().includes("booked")) return false;
    const start = parseAppointmentDateTime(appointment.date, appointment.time);
    if (!start) return false;

    const now = new Date();
    const joinStart = new Date(start.getTime() - 5 * 60 * 1000);
    const joinEnd = new Date(start.getTime() + 30 * 60 * 1000);
    return now >= joinStart && now <= joinEnd;
  };

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMyBookedAppointments();
      const rows = extractAppointments(response?.data);
      setAppointments(rows);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-indigo-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Booked Appointments</h1>
            <p className="text-slate-600 mt-1 text-sm">All your booked and completed appointments.</p>

            {loading ? (
              <div className="py-12 text-center">
                <FiLoader className="mx-auto text-4xl text-cyan-600 animate-spin" />
                <p className="mt-3 text-slate-600">Loading appointments...</p>
              </div>
            ) : error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            ) : appointments.length === 0 ? (
              <div className="py-12 text-center">
                <FiCalendar className="mx-auto text-4xl text-slate-300" />
                <p className="mt-3 text-slate-700">No booked appointments found.</p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((appointment) => (
                  <article
                    key={appointment._id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
                        <FiUser />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Dr. {appointment?.doctor?.name || "Doctor"}</p>
                        <p className="text-xs text-slate-500">{appointment?.doctor?.specialization || "General"}</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <p className="text-slate-500 text-xs">Date</p>
                        <p className="font-semibold text-slate-800 inline-flex items-center gap-1">
                          <FiCalendar /> {appointment.date}
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <p className="text-slate-500 text-xs">Time</p>
                        <p className="font-semibold text-slate-800 inline-flex items-center gap-1">
                          <FiClock /> {appointment.time}
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 col-span-2">
                        <p className="text-slate-500 text-xs">Status</p>
                        <p className="font-semibold text-slate-800">{appointment.status}</p>
                        <p className="text-slate-500 text-xs mt-1">Mode: {appointment.mode === "online" ? "Online" : "Offline"}</p>
                      </div>

                      {appointment.comment ? (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 col-span-2">
                          <p className="text-slate-500 text-xs">Comment</p>
                          <p className="font-medium text-slate-800 text-xs">{appointment.comment}</p>
                        </div>
                      ) : null}
                        <div className="col-span-2 flex gap-2">
                          {appointment.status === "Booked" && canCancelAppointment(appointment.date) ? (
                            <button
                              onClick={() => handleCancelAppointment(appointment._id)}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
                            >
                              <FiTrash2 size={16} /> Cancel Appointment
                            </button>
                          ) : appointment.status === "Booked" && !canCancelAppointment(appointment.date) ? (
                            <div className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500">
                              <FiAlertCircle size={16} /> Cannot Cancel (Within 1 Day)
                            </div>
                          ) : null}
                        </div>

                      {appointment.mode === "online" && canJoinConsultationNow(appointment) ? (
                        <button
                          onClick={() => navigate(`/consultation/${appointment._id}`)}
                          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition"
                        >
                          Join Online Consultation
                        </button>
                      ) : appointment.mode === "online" ? (
                        <div className="col-span-2 text-xs text-slate-500 bg-slate-100 rounded-lg px-3 py-2">
                          Join button appears 5 minutes before the appointment time.
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default MyAppointments;
