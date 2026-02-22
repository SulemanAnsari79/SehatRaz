import React, { useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { toast } from "react-toastify";
import { useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import AuthService from "../../services/AuthService";
import OrderService from "../../services/OrderService";

const Profile = () => {
  const { logout, navigate } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await AuthService.getCurrentUser();

      console.log("Profile data:", data);

      setName(data.user.name || "");
      setEmail(data.user.email || "");
      setPhone(data.user.phone || "");
      setAddress(data.user.address || "");

    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to load profile");
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await OrderService.getUserOrders();
      if (response.success) {
        setOrders(response.orders || []);
      } else {
        toast.error(response.message || "Failed to load orders");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error(error.message || "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchOrders();
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

  const handleProfileChange = () => {
    toast.info("Profile picture change feature is coming soon!");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out successfully!");
  };

  return (
    <>
    <Navbar />
    <div className="bg-gray-50 min-h-screen p-6">

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">

        {/* Left Side - Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow text-center">

          <img src="/user.png" alt="User" className="w-32 h-32 mx-auto rounded-full object-cover"/>

          <h2 className="mt-4 text-xl font-semibold">{name}</h2>

          <p className="text-gray-500">{email}</p>

          <button onClick={handleProfileChange} className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Change Photo</button>

          <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-2">Logout</button>

        </div>

        {/* Right Side - Profile Details */}
        <form onSubmit={UpdateHandler} className="md:col-span-2 bg-white p-6 rounded-xl shadow">

          <h3 className="text-2xl font-semibold mb-6">Profile Information</h3>

          <div className="grid sm:grid-cols-2 gap-4">

            <input type="text" name="name" placeholder="Full Name" value={name} onChange={handleInputChange} className="border p-3 rounded"/>

            <input type="email" name="email" placeholder="Email Address" value={email} onChange={handleInputChange} className="border p-3 rounded"/>

            <input type="text" name="phone" placeholder="Phone Number" value={phone} onChange={handleInputChange} className="border p-3 rounded"/>

            <input type="text" name="address" placeholder="Address" value={address} onChange={handleInputChange} className="border p-3 rounded"/>

          </div>
          <button type="submit" className="mt-6 bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">Save Changes</button>
        </form>

      </div>

      {/* Orders Section */}
      <div className="max-w-6xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">

        <h3 className="text-xl font-semibold mb-4">Recent Orders</h3>

        {  ordersLoading ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order, index) => (
              <div key={order._id || index} className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{order.item || order.productName || 'Product'}</p>
                  <p className="text-sm text-gray-500">Order ID: {order._id}</p>
                </div>
                <span className={`font-medium ${
                  order.status === 'Delivered' ? 'text-green-600' :
                  order.status === 'In Transit' ? 'text-yellow-500' :
                  order.status === 'Processing' ? 'text-blue-500' :
                  'text-gray-500'
                }`}>
                  {order.status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
    <Footer />
    </>
  );
};

export default Profile;

