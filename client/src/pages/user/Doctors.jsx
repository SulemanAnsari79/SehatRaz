import { useEffect, useMemo, useState } from "react";
import { FiAward, FiClock, FiLoader, FiSearch, FiUser } from "react-icons/fi";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getVerifiedDoctors } from "../../services/DoctorService.js";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("All");

  useEffect(() => {
    fetchDoctors();
  }, []);

  const extractDoctors = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.doctors)) return payload.doctors;
    if (payload && typeof payload === "object") {
      const key = Object.keys(payload).find((item) => Array.isArray(payload[item]));
      return key ? payload[key] : [];
    }
    return [];
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getVerifiedDoctors();
      const rows = extractDoctors(response?.data);
      setDoctors(rows);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load doctors.");
      console.error("Get doctors error:", err);
    } finally {
      setLoading(false);
    }
  };

  const specializations = useMemo(() => {
    const values = new Set(
      doctors
        .map((doctor) => doctor.specialization)
        .filter((value) => typeof value === "string" && value.trim().length > 0)
    );

    return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesQuery =
        !q ||
        doctor.name?.toLowerCase().includes(q) ||
        doctor.email?.toLowerCase().includes(q) ||
        doctor.specialization?.toLowerCase().includes(q) ||
        doctor.qualifications?.toLowerCase().includes(q);

      const matchesSpecialization =
        selectedSpecialization === "All" || doctor.specialization === selectedSpecialization;

      return matchesQuery && matchesSpecialization;
    });
  }, [doctors, query, selectedSpecialization]);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-6 md:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, specialization, email, qualification"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              >
                {specializations.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <FiLoader className="mx-auto text-4xl text-cyan-600 animate-spin" />
              <p className="mt-3 text-slate-600">Loading doctors...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
          ) : filteredDoctors.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <FiUser className="mx-auto text-4xl text-slate-300" />
              <p className="mt-3 text-lg font-semibold text-slate-800">No doctors found</p>
              <p className="text-slate-500 text-sm mt-1">Try changing your search or specialization filter.</p>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredDoctors.map((doctor) => (
                <article
                  key={doctor._id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                        <FiUser />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">Dr. {doctor.name}</p>
                        <p className="text-xs text-slate-500 truncate">{doctor.specialization || "General"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-slate-500 text-xs">Experience</p>
                      <p className="font-semibold text-slate-800">{doctor.experience || 0} years</p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-slate-500 text-xs">Consultation Fee</p>
                      <p className="font-semibold text-slate-800">INR {doctor.feesPerConsultation || 0}</p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 col-span-2">
                      <p className="text-slate-500 text-xs">Email</p>
                      <p className="font-medium text-slate-800 break-all text-xs">{doctor.email || "No email"}</p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 col-span-2">
                      <p className="text-slate-500 text-xs flex items-center gap-1">
                        <FiAward /> Qualifications
                      </p>
                      <p className="font-medium text-slate-800 line-clamp-1 text-xs">
                        {doctor.qualifications || "No qualification details"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 col-span-2">
                      <p className="text-slate-500 text-xs flex items-center gap-1">
                        <FiClock /> Available Timings
                      </p>
                      <p className="font-medium text-slate-800 line-clamp-1 text-xs">
                        {Array.isArray(doctor.timings) && doctor.timings.length > 0
                          ? doctor.timings.join(", ")
                          : "Timings not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Link
                      to="/bookappointment"
                      state={{ doctorId: doctor._id }}
                      className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700 transition"
                    >
                      Book Appointment
                    </Link>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Doctors;
