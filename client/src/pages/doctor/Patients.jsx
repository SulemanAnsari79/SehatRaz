import { useContext, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiMail,
  FiSearch,
  FiUser,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext.jsx";
import { getDoctorAppointments } from "../../services/DoctorService.js";

const Patients = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [appointments, setAppointments] = useState([]);

  const doctorId = user?._id ? String(user._id) : "";

  useEffect(() => {
    fetchPatients();
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

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDoctorAppointments();
      const rows = extractAppointments(response?.data);

      // Defense-in-depth: keep only rows linked to logged-in doctor.
      const doctorRows = rows.filter((item) => {
        const rowDoctorId = typeof item?.doctor === "object" ? item?.doctor?._id : item?.doctor;
        if (!doctorId) return true;
        return rowDoctorId ? String(rowDoctorId) === doctorId : false;
      });

      // Requirement: include only patients from Booked/Completed appointments.
      const targetStatuses = new Set(["booked", "completed"]);
      const filteredRows = doctorRows.filter((item) =>
        targetStatuses.has(String(item?.status || "booked").toLowerCase())
      );

      setAppointments(filteredRows);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load patients.");
      console.error("Doctor patients fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const patientRows = useMemo(() => {
    const grouped = new Map();

    for (const apt of appointments) {
      const patient = apt?.user;
      if (!patient?._id) continue;

      const patientId = String(patient._id);
      const status = String(apt?.status || "booked").toLowerCase();
      const aptDate = apt?.date ? new Date(apt.date) : null;
      const isValidDate = aptDate && !Number.isNaN(aptDate.getTime());

      if (!grouped.has(patientId)) {
        grouped.set(patientId, {
          patientId,
          name: patient.name || "Patient",
          email: patient.email || "",
          bookedCount: 0,
          completedCount: 0,
          totalCount: 0,
          latestDate: null,
        });
      }

      const entry = grouped.get(patientId);
      if (status === "booked") entry.bookedCount += 1;
      if (status === "completed") entry.completedCount += 1;
      entry.totalCount += 1;

      if (isValidDate && (!entry.latestDate || aptDate > entry.latestDate)) {
        entry.latestDate = aptDate;
      }
    }

    return [...grouped.values()].sort((a, b) => {
      if (!a.latestDate) return 1;
      if (!b.latestDate) return -1;
      return b.latestDate - a.latestDate;
    });
  }, [appointments]);

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();

    return patientRows
      .filter((row) => {
        if (activeFilter === "booked") return row.bookedCount > 0;
        if (activeFilter === "completed") return row.completedCount > 0;
        return true;
      })
      .filter((row) => {
        if (!q) return true;
        return row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q);
      });
  }, [patientRows, activeFilter, query]);

  const counters = useMemo(() => {
    let bookedOnly = 0;
    let completed = 0;

    for (const row of patientRows) {
      if (row.bookedCount > 0) bookedOnly += 1;
      if (row.completedCount > 0) completed += 1;
    }

    return {
      all: patientRows.length,
      booked: bookedOnly,
      completed,
    };
  }, [patientRows]);

  const emailPatient = (email, name) => {
    if (!email) {
      toast.error("No email available for this patient");
      return;
    }

    const subject = encodeURIComponent("Regarding your appointment");
    const body = encodeURIComponent(`Hi ${name || "Patient"},\n\nI hope you are doing well.\n\nRegards,\nDr. ${user?.name || ""}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl animate-spin text-cyan-600" />
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 ">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-5 md:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Patients</h1>
              <p className="text-slate-600 mt-1 text-sm md:text-base">
                Showing only users with booked or completed appointments for your account.
              </p>
            </div>
          </div>


        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients by name or email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        ) : null}

        {filteredPatients.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <FiUser className="mx-auto text-4xl text-slate-400" />
            <p className="mt-3 text-lg font-semibold text-slate-800">No patients found</p>
            <p className="text-slate-500 text-sm mt-1">Try changing the filter or search value.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPatients.map((row) => (
              <div
                key={row.patientId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                      <FiUser />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{row.name}</p>
                      <p className="text-xs text-slate-500 truncate">{row.email || "No email"}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => emailPatient(row.email, row.name)}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
                  >
                    <FiMail /> Email
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500 text-xs">Booked</p>
                    <p className="font-semibold text-slate-800">{row.bookedCount}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500 text-xs">Completed</p>
                    <p className="font-semibold text-slate-800">{row.completedCount}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500 text-xs">Total</p>
                    <p className="font-semibold text-slate-800">{row.totalCount}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500 text-xs">Last Visit</p>
                    <p className="font-semibold text-slate-800 text-xs md:text-sm">
                      {row.latestDate
                        ? row.latestDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  {row.bookedCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2.5 py-1">
                      <FiClock /> Active Bookings
                    </span>
                  ) : null}
                  {row.completedCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1">
                      <FiCheckCircle /> Has Completed Visits
                    </span>
                  ) : null}
                  {row.latestDate ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2.5 py-1">
                      <FiCalendar /> Recent Interaction
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;
