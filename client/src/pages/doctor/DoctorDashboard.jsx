import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getDoctorAppointments, getDoctorProfile } from "../../services/DoctorService.js";
import StatCard from "../../components/StatCard.jsx";
import {
  FiCalendar,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiArrowRight,
  FiPhone,
  FiUser,
} from "react-icons/fi";

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    todayAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [appointmentsResult, profileResult] = await Promise.allSettled([
        getDoctorAppointments(),
        getDoctorProfile(),
      ]);

      // Handle appointments data
      let appointmentsData = [];
      if (appointmentsResult.status === "fulfilled") {
        const response = appointmentsResult.value?.data;
        // Handle both direct array and wrapped response
        if (Array.isArray(response)) {
          appointmentsData = response;
        } else if (response?.appointments && Array.isArray(response.appointments)) {
          appointmentsData = response.appointments;
        } else if (response && typeof response === "object") {
          // Try to find array in response
          const arrayKey = Object.keys(response).find(
            (key) => Array.isArray(response[key])
          );
          appointmentsData = arrayKey ? response[arrayKey] : [];
        }
        setAppointments(appointmentsData);

        // Calculate statistics only if we have valid data
        if (Array.isArray(appointmentsData) && appointmentsData.length > 0) {
          const total = appointmentsData.length;
          const pending = appointmentsData.filter(
            (apt) => ["booked", "pending", "scheduled"].includes(String(apt.status || "").toLowerCase())
          ).length;
          const completed = appointmentsData.filter(
            (apt) => apt.status?.toLowerCase() === "completed"
          ).length;
          const uniquePatients = new Set(
            appointmentsData.map((apt) => apt.user?._id || apt.userId || apt.patientId)
          ).size;
          const today = appointmentsData.filter(
            (apt) => new Date(apt.date).toDateString() === new Date().toDateString()
          ).length;

          setStats({
            totalAppointments: total,
            pendingAppointments: pending,
            completedAppointments: completed,
            totalPatients: uniquePatients,
            todayAppointments: today,
          });
        } else {
          setStats({
            totalAppointments: 0,
            pendingAppointments: 0,
            completedAppointments: 0,
            totalPatients: 0,
            todayAppointments: 0,
          });
        }
      } else if (appointmentsResult.status === "rejected") {
        const error = appointmentsResult.reason;
        if (error?.response?.status === 401) {
          // Token expired or invalid
          navigate("/login");
          return;
        }
        console.error("Failed to fetch appointments:", error);
      }

      // Handle doctor profile data
      if (profileResult.status === "fulfilled" && profileResult.value?.data) {
        const payload = profileResult.value.data;
        setDoctorProfile(payload?.doctor || payload);
      } else if (profileResult.status === "rejected") {
        const error = profileResult.reason;
        if (error?.response?.status === 401) {
          navigate("/login");
          return;
        }
        console.error("Failed to fetch profile:", error);
      }

      const failedRequests = [appointmentsResult, profileResult].filter(
        (result) => result.status === "rejected"
      );
      if (failedRequests.length > 0 && appointmentsResult.status !== "rejected" && profileResult.status !== "rejected") {
        setError("Some dashboard data could not be loaded. Please refresh.");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load dashboard data";
      setError(errorMsg);
      console.error("Dashboard error:", err);
      
      // Redirect to login on auth errors
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentDateTime = (appointment) => {
    if (!appointment?.date) return null;
    const timeText = String(appointment?.time || "").trim();
    const raw = timeText ? `${appointment.date} ${timeText}` : appointment.date;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const fallback = new Date(appointment.date);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  };

  const upcomingAppointments = appointments
    .filter(
      (apt) =>
        ["booked", "pending", "scheduled"].includes(String(apt.status || "").toLowerCase())
    )
    .filter((apt) => {
      const dateTime = getAppointmentDateTime(apt);
      return dateTime ? dateTime >= new Date() : true;
    })
    .sort((a, b) => {
      const first = getAppointmentDateTime(a);
      const second = getAppointmentDateTime(b);
      if (!first) return 1;
      if (!second) return -1;
      return first - second;
    })
    .slice(0, 5);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === "Select time") return "--:--";
    return timeString;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="text-4xl text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Welcome back, Dr. {doctorProfile?.name?.split(" ")[0] || "Doctor"}!
        </h1>
        <p className="text-gray-600 mt-2 text-sm md:text-base">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <FiAlertCircle className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Warning</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={<FiCalendar />}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Pending Appointments"
          value={stats.pendingAppointments}
          icon={<FiClock />}
          bgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Total Appointments"
          value={stats.totalAppointments}
          icon={<FiCheckCircle />}
          bgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Completed"
          value={stats.completedAppointments}
          icon={<FiCheckCircle />}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<FiUsers />}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-linear-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Upcoming Appointments
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {upcomingAppointments.length} upcoming appointments
                  </p>
                </div>
                <Link
                  to="/doctor/appointments"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  View All <FiArrowRight />
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="p-4 md:p-6 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left Section */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <FiUser className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                              {appointment.userName || appointment.patientName || "Patient"}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500">
                              {appointment.userEmail || appointment.patientEmail || "No email"}
                            </p>
                          </div>
                        </div>
                        {appointment.reason && (
                          <p className="text-sm text-gray-600 mt-2 ml-13">
                            <span className="font-medium">Reason:</span> {appointment.reason}
                          </p>
                        )}
                      </div>

                      {/* Right Section */}
                      <div className="flex flex-col items-start md:items-end gap-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <FiCalendar className="text-blue-600 shrink-0" />
                          <span className="text-sm md:text-base font-medium">
                            {formatDate(appointment.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FiClock className="text-orange-600 shrink-0" />
                          <span className="text-sm md:text-base font-medium">
                            {formatTime(appointment.time)}
                          </span>
                        </div>
                        <button className="mt-2 flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-lg transition text-xs md:text-sm font-semibold">
                          <FiPhone size={14} />
                          Join Call
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <FiCalendar className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No upcoming appointments</p>
                  <p className="text-sm text-gray-400 mt-1">Check back later for new appointments</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-linear-to-r from-purple-50 to-purple-100">
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-600 mt-1">Manage your schedule</p>
          </div>

          <div className="p-6 space-y-3">
            <Link
              to="/doctor/appointments"
              className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors duration-200 group"
            >
              <div className="text-2xl text-blue-600 group-hover:scale-110 transition-transform">
                <FiCalendar />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">View Appointments</p>
                <p className="text-xs text-gray-600">Manage appointments</p>
              </div>
              <FiArrowRight className="ml-auto text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link
              to="/doctor/patients"
              className="flex items-center gap-3 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors duration-200 group"
            >
              <div className="text-2xl text-green-600 group-hover:scale-110 transition-transform">
                <FiUsers />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">View Patients</p>
                <p className="text-xs text-gray-600">Patient records</p>
              </div>
              <FiArrowRight className="ml-auto text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link
              to="/doctor/profile"
              className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors duration-200 group"
            >
              <div className="text-2xl text-purple-600 group-hover:scale-110 transition-transform">
                <FiCheckCircle />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Edit Profile</p>
                <p className="text-xs text-gray-600">Update information</p>
              </div>
              <FiArrowRight className="ml-auto text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link
              to="/doctor/leave-requests"
              className="flex items-center gap-3 p-4 rounded-lg bg-red-50 hover:bg-red-100 transition-colors duration-200 group"
            >
              <div className="text-2xl text-red-600 group-hover:scale-110 transition-transform">
                <FiAlertCircle />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Leave Requests</p>
                <p className="text-xs text-gray-600">Request and track leaves</p>
              </div>
              <FiArrowRight className="ml-auto text-gray-400 group-hover:text-gray-600" />
            </Link>

            <button
              onClick={fetchDashboardData}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-700 font-semibold text-sm"
            >
              <FiLoader /> Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity / Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointment Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Appointment Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Pending</span>
                <span className="text-sm font-bold text-blue-600">
                  {stats.pendingAppointments}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      stats.totalAppointments > 0
                        ? (stats.pendingAppointments / stats.totalAppointments) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Completed</span>
                <span className="text-sm font-bold text-green-600">
                  {stats.completedAppointments}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      stats.totalAppointments > 0
                        ? (stats.completedAppointments / stats.totalAppointments) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  {stats.totalAppointments}
                </span>{" "}
                total appointments
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Completion rate:{" "}
                <span className="font-semibold text-gray-900">
                  {stats.totalAppointments > 0
                    ? Math.round(
                        (stats.completedAppointments / stats.totalAppointments) * 100
                      )
                    : 0}
                  %
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Professional Info Card */}
        <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Professional Information</h3>
          {doctorProfile ? (
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium">Name</p>
                <p className="text-sm font-semibold text-gray-900">{doctorProfile.name}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium">Specialization</p>
                <p className="text-sm font-semibold text-gray-900">
                  {doctorProfile.specialization || "Not specified"}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium">License Number</p>
                <p className="text-sm font-semibold text-gray-900">
                  {doctorProfile.licenseNumber || "Not specified"}
                </p>
              </div>
              <Link
                to="/doctor/profile"
                className="block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-center transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600">Profile information loading...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
