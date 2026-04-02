import React, { useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { toast } from "react-toastify";
import { useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import AuthService from "../../services/AuthService";

const Profile = () => {
  const { logout, navigate } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileImage, setProfileImage] = useState("https://via.placeholder.com/150x150?text=User");
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("https://via.placeholder.com/150x150?text=User");
  const [imageUploading, setImageUploading] = useState(false);
  
  // Settings state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await AuthService.getCurrentUser();

      console.log("Profile data:", data);

      setName(data.user.name || "");
      setEmail(data.user.email || "");
      setPhone(data.user.phone || "");
      setAddress(data.user.address || "");
      
      if (data.user.image) {
        setProfileImage(data.user.image);
        setPreviewImage(data.user.image);
      }

    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") setName(value);
    if (name === "email") setEmail(value);
    if (name === "phone") setPhone(value);
    if (name === "address") setAddress(value);
  };

  const UpdateHandler =async (e) => {
    e.preventDefault();

    const response= await AuthService.updateProfile({ name, email, phone, address });
    if (response.success) {
    toast.success("Profile updated successfully!");
    fetchProfile(); // Refresh profile data after update
    } else {
    toast.error(response.message || "Failed to update profile");
    }
  };

  // const handleProfileChange = () => {
  //   toast.info("Profile picture change feature is coming soon!");
  // };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      toast.error("Please select an image first");
      return;
    }

    setImageUploading(true);
    try {
      const response = await AuthService.uploadProfileImage(imageFile);
      if (response.success) {
        toast.success("Profile image updated successfully!");
        setProfileImage(response.image || previewImage);
        setImageFile(null);
        fetchProfile();
      } else {
        toast.error(response.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out successfully!");
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

    setPasswordLoading(true);
    try {
      const response = await AuthService.changePassword(currentPassword, newPassword);
      if (response.success) {
        toast.success("Password changed successfully!");
        setShowChangePasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        toast.error(response.message || "Failed to change password");
      }
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    if (!deletePassword) {
      toast.error("Password is required to delete account");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await AuthService.deleteAccount(deletePassword);
      if (response.success) {
        toast.success("Account deleted successfully");
        setShowDeleteAccountModal(false);
        logout();
        navigate("/");
      } else {
        toast.error(response.message || "Failed to delete account");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
    <Navbar />
    <div className="bg-gray-50 min-h-screen p-6">

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">

        {/* Left Side - Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow text-center">

          <div className="relative inline-block mb-4">
            <img src={previewImage} alt="User" className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-gray-200"/>
            <label htmlFor="image-input" className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition">
              📷
            </label>
            <input 
              id="image-input"
              type="file" 
              accept="image/*" 
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {imageFile && (
            <div className="mb-3 flex gap-2 justify-center">
              <button 
                onClick={handleUploadImage}
                disabled={imageUploading}
                className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 disabled:opacity-50"
              >
                {imageUploading ? "Uploading..." : "Upload"}
              </button>
              <button 
                onClick={() => {
                  setImageFile(null);
                  setPreviewImage(profileImage);
                }}
                className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          )}

          <h2 className="mt-4 text-xl font-semibold">{name}</h2>

          <p className="text-gray-500">{email}</p>

          <button onClick={handleLogout} className="bg-black text-white text-sm my-8 px-8 py-3 rounded-xl hover:bg-red-600">Logout</button>

        </div>

        {/* Right Side - Profile Details */}
        <form onSubmit={UpdateHandler} className="md:col-span-2 bg-white p-6 rounded-xl shadow">

          <h3 className="text-2xl font-semibold mb-6">Profile Information</h3>

          <div className="grid sm:grid-cols-2 gap-4">

            <div className="flex flex-col gap-1">
              <label htmlFor="profile-name" className="text-sm font-medium text-gray-700">Full Name</label>
              <input id="profile-name" type="text" name="name" placeholder="Full Name" value={name} onChange={handleInputChange} className="border p-2 rounded"/>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="profile-email" className="text-sm font-medium text-gray-700">Email Address</label>
              <input id="profile-email" type="email" name="email" placeholder="Email Address" value={email} onChange={handleInputChange} className="border p-2 rounded"/>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="profile-phone" className="text-sm font-medium text-gray-700">Phone Number</label>
              <input id="profile-phone" type="text" name="phone" placeholder="Phone Number" value={phone} onChange={handleInputChange} className="border p-2 rounded"/>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label htmlFor="profile-address" className="text-sm font-medium text-gray-700">Address</label>
              <input id="profile-address" type="text" name="address" placeholder="Address" value={address} onChange={handleInputChange} className="border p-2 rounded"/>
            </div>

          </div>
          <button type="submit" className="bg-black text-white text-sm my-8 px-8 py-3 rounded-xl">Save Changes</button>
        </form>

      </div>

      {/* Account Settings Section */}
      <div className="max-w-6xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-6">Account Settings</h3>
        
        <div className="space-y-4">
          {/* My Orders Button */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h4 className="font-semibold text-gray-800">My Orders</h4>
              <p className="text-sm text-gray-500">View all your orders and track status</p>
            </div>
            <button 
              onClick={() => navigate('/place-order')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              View
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h4 className="font-semibold text-gray-800">My Appointments</h4>
              <p className="text-sm text-gray-500">View your booked and completed appointments</p>
            </div>
            <button
              onClick={() => navigate('/my-appointments')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              View
            </button>
          </div>

          {/* Change Password Button */}
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h4 className="font-semibold text-gray-800">Change Password</h4>
              <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
            </div>
            <button 
              onClick={() => setShowChangePasswordModal(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Change
            </button>
          </div>

          {/* Delete Account Button */}
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50">
            <div>
              <h4 className="font-semibold text-red-700">Delete Account</h4>
              <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
            </div>
            <button 
              onClick={() => setShowDeleteAccountModal(true)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
              <button 
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-700">Delete Account</h3>
              <button 
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeletePassword("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. All your data including orders, appointments, and profile information will be permanently deleted.
              </p>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Your Password to Confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter password"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {passwordLoading ? "Deleting..." : "Delete Account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAccountModal(false);
                    setDeletePassword("");
                  }}
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
    <Footer />
    </>
  );
};

export default Profile;

