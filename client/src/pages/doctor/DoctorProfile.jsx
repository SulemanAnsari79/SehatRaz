import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctorProfile, updateDoctorProfile } from "../../services/DoctorService.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import {
  FiEdit2,
  FiSave,
  FiX,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiPhone,
  FiMail,
  FiAward,
  FiDollarSign,
  FiClock,
  FiUser,
} from "react-icons/fi";
import { toast } from "react-toastify";

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    specialization: "",
    experience: 0,
    feesPerConsultation: 0,
    timings: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Diagnostic: Check if token exists
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        setTimeout(() => navigate("/login"), 1500);
        setLoading(false);
        return;
      }
      
      const result = await getDoctorProfile();

      // Extract doctor data from response
      let doctorData = null;
      
      // Handle different response structures
      if (result?.data?.doctor) {
        doctorData = result.data.doctor;
       } else if (result?.data?.success && result?.data) {
        // If success but no doctor property, check if data itself is the doctor
        if (result.data._id || result.data.name) {
          doctorData = result.data;
         }
      }
      
      if (doctorData) {
         setProfile(doctorData);
        setFormData({
          specialization: doctorData.specialization || "",
          experience: doctorData.experience || 0,
          feesPerConsultation: doctorData.feesPerConsultation || 0,
          timings: Array.isArray(doctorData.timings) 
            ? doctorData.timings.join(", ") 
            : doctorData.timings || "",
        });
      } else {
        setError("Invalid profile data received from server");
       }
    } catch (err) {
      
      // Handle different error types
      if (err.response?.status === 401) {
        setError("Session expired. Please login again. (401 Unauthorized)");
        setTimeout(() => navigate("/login"), 1500);
      } else if (err.response?.status === 404) {
        setError("Doctor profile not found. Please contact support. (404)");
      } else if (err.response?.status === 403) {
        setError("Access denied. (403 Forbidden)");
      } else if (err.response?.data?.message) {
        setError(`Error: ${err.response.data.message}`);
      } else if (err.message === "Network Error") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(`Failed to load profile: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "experience" || name === "feesPerConsultation" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updatePayload = {
        specialization: formData.specialization,
        experience: formData.experience,
        feesPerConsultation: formData.feesPerConsultation,
        timings: formData.timings
          .split(",")
          .map(t => t.trim())
          .filter(t => t),
      };

      const result = await updateDoctorProfile(updatePayload);
      
      // Extract updated doctor data
      let updatedDoctor = null;
      if (result?.data?.doctor) {
        updatedDoctor = result.data.doctor;
      } else if (result?.data?.success && result?.data) {
        if (result.data._id || result.data.name) {
          updatedDoctor = result.data;
        }
      }
      
      if (updatedDoctor) {
        setProfile(updatedDoctor);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile. Please refresh and try again.");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        setTimeout(() => navigate("/login"), 1500);
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      specialization: profile?.specialization || "",
      experience: profile?.experience || 0,
      feesPerConsultation: profile?.feesPerConsultation || 0,
      timings: Array.isArray(profile?.timings)
        ? profile.timings.join(", ")
        : profile?.timings || "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="text-4xl text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md">
          <div className="text-center mb-6">
            <FiAlertCircle className="text-4xl text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Profile</h2>
            <p className="text-gray-600 text-sm mb-4">{error || "Unable to load your profile"}</p>
            
            {/* Debug Info */}
            <div className="bg-gray-100 p-3 rounded-lg mb-4 text-xs text-left">
              <p className="font-mono text-gray-700 mb-1">
                Token: {localStorage.getItem("token") ? "✓ Found" : "✗ Missing"}
              </p>
              <p className="font-mono text-gray-700">
                User: {localStorage.getItem("user") ? "✓ Found" : "✗ Missing"}
              </p>
              <p className="font-mono text-gray-700 mt-2 text-orange-600">
                💡 Check browser console (F12) for detailed logs
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={fetchProfile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              <FiLoader /> Retry Loading
            </button>
            
            <button
              onClick={() => navigate("/doctor")}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg transition"
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
              }}
              className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-3 px-6 rounded-lg transition"
            >
              Login Again
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            If the problem persists, please contact support.
          </p>
        </div>
      </div>
    );
  }

  const initials = profile.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "DR";

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">Manage your professional information</p>
          </div>
          <button
            onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg font-semibold transition ${
              isEditing
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isEditing ? (
              <>
                <FiX size={18} /> Cancel
              </>
            ) : (
              <>
                <FiEdit2 size={18} /> Edit Profile
              </>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <FiAlertCircle className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Profile Header with Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-32 md:h-40" />

          {/* Profile Content */}
          <div className="px-6 md:px-8 pb-8">
            {/* Profile Section */}
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 md:-mt-20 mb-8 relative z-10">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 md:w-32 h-24 md:h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg flex items-center justify-center border-4 border-white">
                  <span className="text-4xl md:text-5xl font-bold text-white">{initials}</span>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-black font-semibold text-lg mt-1">
                      {profile.specialization || "Not specified"}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-gray-600">
                      <FiAward size={16} />
                      <span>{profile.experience || 0} years experience</span>
                    </div>
                  </div>

                  {/* Verification Badge */}
                  <div className="text-center">
                    {profile.verified ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                          <FiCheckCircle className="text-green-600" size={20} />
                          <span className="font-semibold text-green-700">Verified</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                          <FiAlertCircle className="text-amber-600" size={20} />
                          <span className="font-semibold text-amber-700">Pending</span>
                        </div>
                        {profile.rejectionReason && (
                          <p className="text-xs text-gray-600 mt-2 max-w-xs">
                            {profile.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-50">
                    <FiMail className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Email</p>
                    <p className="text-gray-900 font-semibold">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-green-50">
                    <FiPhone className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Phone</p>
                    <p className="text-gray-900 font-semibold">{profile.phone || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Professional Information</h3>

                {isEditing ? (
                  <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                    {/* Specialization */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Specialization
                      </label>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        placeholder="e.g., Cardiology, Orthopedics"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Experience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Consultation Fees */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Consultation Fees (₹)
                        </label>
                        <input
                          type="number"
                          name="feesPerConsultation"
                          value={formData.feesPerConsultation}
                          onChange={handleInputChange}
                          min="0"
                          placeholder="Enter amount in rupees"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Timings */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Available Timings (comma separated)
                      </label>
                      <textarea
                        name="timings"
                        value={formData.timings}
                        onChange={handleInputChange}
                        placeholder="e.g., 9:00 AM - 12:00 PM, 4:00 PM - 7:00 PM"
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-2">Enter each time slot separated by commas</p>
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
                      >
                        {saving ? (
                          <>
                            <FiLoader className="animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <FiSave /> Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Specialization Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-200 rounded-lg">
                          <FiAward className="text-blue-700 text-lg" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Specialization</h4>
                      </div>
                      <p className="text-gray-700 font-medium text-lg">
                        {profile.specialization || "Not specified"}
                      </p>
                    </div>

                    {/* Experience Card */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-200 rounded-lg">
                          <FiUser className="text-green-700 text-lg" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Experience</h4>
                      </div>
                      <p className="text-gray-700 font-medium text-lg">
                        {profile.experience || 0} <span className="text-sm">years</span>
                      </p>
                    </div>

                    {/* Consultation Fees Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-200 rounded-lg">
                          <FiDollarSign className="text-purple-700 text-lg" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Consultation Fees</h4>
                      </div>
                      <p className="text-gray-700 font-medium text-lg">
                        ₹{profile.feesPerConsultation || 0}
                      </p>
                    </div>

                    {/* Timings Card */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-200 rounded-lg">
                          <FiClock className="text-orange-700 text-lg" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Available Timings</h4>
                      </div>
                      <div className="space-y-2">
                        {Array.isArray(profile.timings) && profile.timings.length > 0 ? (
                          profile.timings.map((time, index) => (
                            <p key={index} className="text-gray-700 font-medium text-sm">
                              • {time}
                            </p>
                          ))
                        ) : (
                          <p className="text-gray-600 text-sm">Not specified</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Qualifications Section */}
              {profile.qualifications && (
                <div className="border-t border-gray-200 pt-8 mt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Qualifications</h3>
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                      {profile.qualifications}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Member Since */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Member Since</p>
            <p className="text-2xl font-bold text-gray-900">
              {profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "long",
                  })
                : "Unknown"}
            </p>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Account Status</p>
            <div className="flex items-center gap-2">
              {profile.verified ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <p className="text-lg font-bold text-green-600">Verified</p>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <p className="text-lg font-bold text-amber-600">Pending</p>
                </>
              )}
            </div>
          </div>

          {/* Last Updated */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Last Updated</p>
            <p className="text-2xl font-bold text-gray-900">
              {profile.updatedAt
                ? new Date(profile.updatedAt).toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                  })
                : "Unknown"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
