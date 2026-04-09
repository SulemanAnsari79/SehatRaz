import { useContext, useEffect, useMemo, useState } from "react";
import { FiCalendar, FiCheckCircle, FiClock, FiLoader, FiSearch, FiUser, FiXCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext.jsx";
import { getDoctorAppointments, updateAppointmentStatus } from "../../services/DoctorService.js";

const statusStyles = {
  booked: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  scheduled: "bg-indigo-100 text-indigo-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const Appointments = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState("");

  const doctorId = user?._id ? String(user._id) : "";

  useEffect(() => {
    fetchAppointments();
  }, []);

  const extractAppointments = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.appointments)) return payload.appointments;
    if (payload && typeof payload === "object") {
      const foundKey = Object.keys(payload).find((key) => Array.isArray(payload[key]));
      return foundKey ? payload[foundKey] : [];
    }
    return [];
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDoctorAppointments();
      const allRows = extractAppointments(response?.data);

      // Defense-in-depth: keep only rows for logged-in doctor if doctor id is available.
      const safeRows = allRows.filter((item) => {
        const rowDoctorId = typeof item?.doctor === "object" ? item?.doctor?._id : item?.doctor;
        if (!doctorId) return true;
        return rowDoctorId ? String(rowDoctorId) === doctorId : false;
      });

      setAppointments(safeRows);
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to load appointments.";
      setError(message);
      console.error("Doctor appointments error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      await updateAppointmentStatus(id, status);
      setAppointments((prev) =>
        prev.map((apt) => (apt._id === id ? { ...apt, status } : apt))
      );
      toast.success(`Appointment marked as ${status}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update appointment status");
    } finally {
      setUpdatingId("");
    }
  };

  const normalized = useMemo(() => {
    return appointments.map((apt) => {
      const status = (apt.status || "Booked").toLowerCase();
      const dateObj = apt.date ? new Date(apt.date) : null;
      const isValidDate = dateObj && !Number.isNaN(dateObj.getTime());
      const patientName = apt?.user?.name || "Patient";
      const patientEmail = apt?.user?.email || "No email";

      return {
        ...apt,
        status,
        patientName,
        patientEmail,
        dateObj,
        isValidDate,
      };
    });
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalized
      .filter((apt) => (activeFilter === "all" ? true : apt.status === activeFilter))
      .filter((apt) => {
        if (!q) return true;
        return (
          apt.patientName.toLowerCase().includes(q) ||
          apt.patientEmail.toLowerCase().includes(q) ||
          apt.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const createdA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (createdA !== createdB) return createdB - createdA;
        if (!a.isValidDate) return 1;
        if (!b.isValidDate) return -1;
        return b.dateObj - a.dateObj;
      });
  }, [normalized, activeFilter, query]);

  const counters = useMemo(() => {
    return normalized.reduce(
      (acc, apt) => {
        acc.all += 1;
        if (apt.status in acc) acc[apt.status] += 1;
        return acc;
      },
      { all: 0, booked: 0, pending: 0, scheduled: 0, completed: 0, cancelled: 0 }
    );
  }, [normalized]);

  const filterPills = [
    { key: "all", label: "All" },
    { key: "booked", label: "Booked" },
    { key: "pending", label: "Pending" },
    { key: "scheduled", label: "Scheduled" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const todaysAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return normalized
      .filter((apt) => apt.isValidDate && apt.dateObj.toDateString() === today)
      .sort((a, b) => {
        if (!a.isValidDate) return 1;
        if (!b.isValidDate) return -1;
        return a.dateObj - b.dateObj;
      });
  }, [normalized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl animate-spin text-blue-600" />
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8  ">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="p-5 md:p-7 ">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">   
              <h1 className="text-3xl md:text-3xl font-bold text-slate-900">Yours Appointments</h1>
           </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by patient name, email, or status"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="md:w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            >
              {filterPills.map((pill) => (
                <option key={pill.key} value={pill.key}>
                  {pill.label} ({counters[pill.key]})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 bg-linear-to-r from-emerald-50 to-cyan-50 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900">Today's Appointments</h2>
              <p className="text-sm text-slate-600">{todaysAppointments.length} scheduled today</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              Today
            </span>
          </div>

          {todaysAppointments.length === 0 ? (
            <div className="p-6 text-center">
              <FiCalendar className="mx-auto text-3xl text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No appointments for today.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {todaysAppointments.map((apt) => (
                <div key={`today-${apt._id}`} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{apt.patientName}</p>
                    <p className="text-xs text-slate-500 truncate">{apt.patientEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{apt.time || "Not set"}</p>
                    <p className="text-xs text-slate-500 capitalize">{apt.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        ) : null}

        {filteredAppointments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <FiCalendar className="mx-auto text-4xl text-slate-400" />
            <p className="mt-3 text-lg font-semibold text-slate-800">No appointments found</p>
            <p className="text-slate-500 text-sm mt-1">
              Try changing your filter or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAppointments.map((apt) => {
              const badgeClass = statusStyles[apt.status] || "bg-slate-100 text-slate-700";
              return (
                <div
                  key={apt._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                        <FiUser />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{apt.patientName}</p>
                        <p className="text-xs text-slate-500 truncate">{apt.patientEmail}</p>
                      </div>
                    </div>

                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${badgeClass}`}>
                      {apt.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-slate-500 text-xs">Date</p>
                      <p className="font-semibold text-slate-800">
                        {apt.isValidDate
                          ? apt.dateObj.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Not set"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-slate-500 text-xs">Time</p>
                      <p className="font-semibold text-slate-800">{apt.time || "Not set"}</p>
                    </div>
                  </div>

                  {apt.mode === "online" && (apt.status === "booked" || apt.status === "scheduled") ? (
                    <button
                      onClick={() => navigate(`/doctor/consultation/${apt._id}`)}
                      className="mt-3 inline-flex items-center justify-center rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
                    >
                      Join Online Consultation
                    </button>
                  ) : null}

                  {(apt.status === "booked" || apt.status === "pending" || apt.status === "scheduled") && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        disabled={updatingId === apt._id}
                        onClick={() => updateStatus(apt._id, "Completed")}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <FiCheckCircle /> Mark Completed
                      </button>

                      <button
                        disabled={updatingId === apt._id}
                        onClick={() => updateStatus(apt._id, "Cancelled")}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        <FiXCircle /> Cancel
                      </button>

                      {updatingId === apt._id && (
                        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                          <FiClock className="animate-pulse" /> Updating...
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
