import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiLock, FiTrash2, FiUser, FiMail, FiPhone, FiX } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import {
  changeDeliveryPassword,
  deleteDeliveryAccount,
  getDeliveryProfile,
} from "../../services/DeliveryService";

const DeliveryProfile = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getDeliveryProfile();
      setProfile(response?.data?.deliveryMan || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const closeDeleteModal = () => {
    setShowDeleteAccountModal(false);
    setDeletePassword("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      setSubmitting(true);
      await changeDeliveryPassword(currentPassword, newPassword);
      toast.success("Password changed successfully!");
      closeChangePasswordModal();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    if (!deletePassword) {
      toast.error("Password is required to delete account");
      return;
    }

    try {
      setSubmitting(true);
      await deleteDeliveryAccount(deletePassword);
      toast.success("Account deleted successfully");
      logout();
      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete account");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">My Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <FiUser className="text-blue-600" />
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-semibold text-gray-800">{profile?.name || "-"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <FiMail className="text-blue-600" />
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-semibold text-gray-800">{profile?.email || "-"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <FiPhone className="text-blue-600" />
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-semibold text-gray-800">{profile?.phone || "-"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <FiUser className="text-blue-600" />
            <div>
              <p className="text-gray-500">Account Status</p>
              <p className="font-semibold text-gray-800">{profile?.isActive ? "Active" : "Inactive"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Account Settings</h2>

        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div>
            <h3 className="font-semibold text-gray-800">Change Password</h3>
            <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
          </div>
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FiLock size={16} /> Change
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50">
          <div>
            <h3 className="font-semibold text-red-700">Delete Account</h3>
            <p className="text-sm text-gray-500">Permanently delete your delivery account</p>
          </div>
          <button
            onClick={() => setShowDeleteAccountModal(true)}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <FiTrash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
              <button onClick={closeChangePasswordModal} className="text-gray-500 hover:text-gray-700">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? "Changing..." : "Change Password"}
                </button>
                <button
                  type="button"
                  onClick={closeChangePasswordModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-700">Delete Account</h3>
              <button onClick={closeDeleteModal} className="text-gray-500 hover:text-gray-700">
                <FiX />
              </button>
            </div>

            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. Your delivery account will be permanently deleted.
              </p>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? "Deleting..." : "Delete Account"}
                </button>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryProfile;
