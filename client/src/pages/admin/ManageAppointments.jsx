import { useEffect, useState } from "react";
import { getAppointments, deleteAppointment, createAdminAppointment, updateAppointmentStatus } from "../../services/AdminService.js";
import { getUsers } from "../../services/AdminService.js";
import { getDoctors } from "../../services/AdminService.js";
import {
  FiSearch,
  FiTrash2,
  FiPlus,
  FiLoader,
  FiX,
  FiCheck,
  FiCalendar,
  FiClock,
  FiUser,
  FiBriefcase,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";

const ManageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [formData, setFormData] = useState({
    userId: "",
    doctorId: "",
    date: "",
    time: "",
    mode: "in_person",
    comment: "",
    status: "Booked",
  });

  const times = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
    fetchUsers();
    fetchDoctors();
  }, []);

  // Filter appointments based on search and status
  useEffect(() => {
    let filtered = appointments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((apt) => apt.status.toLowerCase() === filterStatus.toLowerCase());
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, filterStatus]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAppointments();
      const appts = response.data?.appointments || response.data || [];
      const sorted = [...appts].sort((a, b) => {
        const createdA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (createdA !== createdB) return createdB - createdA;
        const dateA = a?.date ? new Date(`${a.date} ${a.time || ""}`).getTime() : 0;
        const dateB = b?.date ? new Date(`${b.date} ${b.time || ""}`).getTime() : 0;
        return dateB - dateA;
      });
      setAppointments(sorted);
    } catch (err) {
      console.error("Fetch appointments error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to load appointments";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await getDoctors();
      setDoctors(response.data?.doctors || response.data || []);
    } catch (err) {
      console.error("Fetch doctors error:", err);
    }
  };

  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setFormData({
      userId: "",
      doctorId: "",
      date: "",
      time: "",
      mode: "in_person",
      comment: "",
      status: "Booked",
    });
    setModalMode("add");
    setShowModal(true);
  };

  const handleDeleteAppointment = async (id) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        await deleteAppointment(id);
        setAppointments(appointments.filter((apt) => apt._id !== id));
        toast.success("Appointment deleted successfully");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete appointment");
        toast.error("Failed to delete appointment");
      }
    }
  };

  const handleSaveAppointment = async () => {
    try {
      // Validate form
      if (!formData.userId || !formData.doctorId || !formData.date || !formData.time) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (modalMode === "add") {
        const response = await createAdminAppointment(formData);
        if (response.data.success) {
          setAppointments([...appointments, response.data.appointment]);
          toast.success("Appointment created successfully");
          setShowModal(false);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to save appointment";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const response = await updateAppointmentStatus(appointmentId, newStatus);
      setAppointments(
        appointments.map((apt) =>
          apt._id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
      toast.success("Status updated successfully");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl animate-spin text-blue-600" />
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
          <FiAlertCircle className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Appointments</h1>
          <p className="text-gray-600 mt-1">View, create, and manage all appointments</p>
        </div>
        <button
          onClick={handleAddAppointment}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
        >
          <FiPlus /> New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white shadow p-4 space-y-4 md:flex md:gap-4 md:space-y-0">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient name, email, or doctor..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="md:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm outline-none focus:border-blue-400"
          >
            <option value="all">All Status</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="rounded-lg bg-white shadow overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center">
            <FiCalendar className="mx-auto text-4xl text-gray-400 mb-3" />
            <p className="text-lg font-semibold text-gray-800">No appointments found</p>
            <p className="text-gray-500 text-sm mt-1">Try changing your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Payment Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <FiUser className="text-gray-400" /> {appointment.user?.name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">{appointment.user?.email || "N/A"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <FiBriefcase className="text-gray-400" /> {appointment.doctor?.name || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${appointment.mode === "online" ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-700"}`}>
                        {appointment.mode === "online" ? "Online" : "In-person"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FiCalendar className="text-gray-400" />
                        <span>{appointment.date}</span>
                        {appointment.time && (
                          <div className="flex items-center gap-1">
                            <FiClock className="text-gray-400" />
                            <span>{appointment.time}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment._id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer
                          ${
                            appointment.status === "Booked"
                              ? "bg-blue-100 text-blue-700"
                              : appointment.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                      >
                        <option value="Booked">Booked</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          appointment.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-700"
                            : appointment.paymentStatus === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {appointment.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteAppointment(appointment._id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 transition"
                        title="Delete appointment"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-6">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === "add" ? "New Appointment" : "Edit Appointment"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">Select Patient</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doctor *</label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">Select Time</option>
                  {times.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Type</label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm outline-none focus:border-blue-400"
                >
                  <option value="in_person">In-person</option>
                  <option value="online">Online (Video + Chat)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Add any notes..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm outline-none focus:border-blue-400"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm outline-none focus:border-blue-400"
                >
                  <option value="Booked">Booked</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t p-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAppointment}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
              >
                <FiCheck /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAppointments;
