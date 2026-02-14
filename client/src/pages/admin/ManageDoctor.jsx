import { useEffect, useState } from "react";
import { getDoctors, deleteDoctor, updateDoctor } from "../../services/AdminService.js";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiPlus,
  FiLoader,
  FiEye,
  FiFilter,
  FiDownload,
} from "react-icons/fi";

const ManageDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    qualifications: "",
    experience: "",
    verified: false,
  });

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filter doctors based on search and status
  useEffect(() => {
    let filtered = doctors;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by verification status
    if (filterStatus !== "all") {
      filtered = filtered.filter((doc) =>
        filterStatus === "verified" ? doc.verified : !doc.verified
      );
    }

    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, filterStatus]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDoctors();
      setDoctors(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load doctors");
      console.error("Fetch doctors error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData(doctor);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData(doctor);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDeleteDoctor = async (id) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      try {
        await deleteDoctor(id);
        setDoctors(doctors.filter((doc) => doc._id !== id));
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete doctor");
      }
    }
  };

  const handleVerifyDoctor = async (id, currentStatus) => {
    try {
      await updateDoctor(id, { verified: !currentStatus });
      setDoctors(
        doctors.map((doc) =>
          doc._id === id ? { ...doc, verified: !currentStatus } : doc
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update doctor");
    }
  };

  const handleSaveDoctor = async () => {
    try {
      if (modalMode === "edit") {
        await updateDoctor(selectedDoctor._id, formData);
        setDoctors(
          doctors.map((doc) =>
            doc._id === selectedDoctor._id ? { ...doc, ...formData } : doc
          )
        );
      }
      setShowModal(false);
      setSelectedDoctor(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save doctor");
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="text-4xl text-green-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Manage Doctors</h1>
            <p className="text-gray-600 mt-2">
              Total Doctors: <span className="font-semibold text-green-600">{doctors.length}</span>
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg transition">
            <FiPlus size={20} />
            Add Doctor
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Doctors</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Export */}
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
            <FiDownload size={20} />
            Export
          </button>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Doctor List</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredDoctors.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Specialization</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Experience</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map((doctor) => (
                  <tr
                    key={doctor._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                          {doctor.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{doctor.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.specialization}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {doctor.experience} {doctor.experience === 1 ? "year" : "years"}
                    </td>
                    <td className="px-6 py-4">
                      {doctor.verified ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiCheck size={14} className="mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <FiX size={14} className="mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleViewDoctor(doctor)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditDoctor(doctor)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Edit"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleVerifyDoctor(doctor._id, doctor.verified)
                          }
                          className={`p-2 ${
                            doctor.verified
                              ? "text-red-600 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                          } rounded-lg transition`}
                          title={doctor.verified ? "Unverify" : "Verify"}
                        >
                          {doctor.verified ? (
                            <FiX size={18} />
                          ) : (
                            <FiCheck size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doctor._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 font-medium">
                {searchTerm || filterStatus !== "all"
                  ? "No doctors found matching your criteria"
                  : "No doctors yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {modalMode === "view" ? "Doctor Details" : "Edit Doctor"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:opacity-80 transition"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    disabled={modalMode === "view"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    disabled={modalMode === "view"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    disabled={modalMode === "view"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleFormChange}
                    disabled={modalMode === "view"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleFormChange}
                    disabled={modalMode === "view"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleFormChange}
                    disabled={modalMode === "view"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Verification Checkbox */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="verified"
                    checked={formData.verified}
                    onChange={handleFormChange}
                    disabled={modalMode === "view"}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-900 font-medium">Mark as Verified</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Close
              </button>
              {modalMode === "edit" && (
                <button
                  onClick={handleSaveDoctor}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition font-medium"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDoctor;
