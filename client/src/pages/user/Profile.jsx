import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { toast } from "react-toastify";
import { useState } from "react";

const Profile = () => {

  const [name, setName] = useState("User Name");
  const [email, setEmail] = useState("user@gmail.com")
  const [phone, setPhone] = useState("123-456-7890");
  const [address, setAddress] = useState("123 Main St, City, Country");
  
  const [orders, setOrders] = useState([
    { id: 1, item: "Vitamin C Tablets", status: "Delivered" },
    { id: 2, item: "Skin Care Cream", status: "In Transit" },
    { id: 3, item: "Blood Pressure Monitor", status: "Processing" },
  ]);

  const UpdateHandler = (e) => {
    e.preventDefault();

    // Implement profile update logic here
    toast.success("Profile updated successfully!");
  };

  return (
    <>
    <Navbar />
    <div className="bg-gray-50 min-h-screen p-6">

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">

        {/* Left Side - Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow text-center">

          <img src="/user.png" alt="User" className="w-32 h-32 mx-auto rounded-full object-cover"/>

          <h2 className="mt-4 text-xl font-semibold">Muhammad Suleman</h2>

          <p className="text-gray-500">sehatraz@gmail.com</p>

          <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Change Photo</button>

        </div>

        {/* Right Side - Profile Details */}
        <form onSubmit={UpdateHandler} className="md:col-span-2 bg-white p-6 rounded-xl shadow">

          <h3 className="text-2xl font-semibold mb-6">Profile Information</h3>

          <div className="grid sm:grid-cols-2 gap-4">

            <input type="text" placeholder="Full Name" className="border p-3 rounded"/>

            <input type="email" placeholder="Email Address" className="border p-3 rounded"/>

            <input type="text"placeholder="Phone Number" className="border p-3 rounded"/>

            <input type="text" placeholder="Address" className="border p-3 rounded"/>

          </div>
          <button type="submit" className="mt-6 bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">Save Changes</button>
        </form>

      </div>

      {/* Orders Section */}
      <div className="max-w-6xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">

        <h3 className="text-xl font-semibold mb-4">Recent Orders</h3>

        <div className="space-y-3">

          <div className="flex justify-between border-b pb-2">
            <span>Vitamin C Tablets</span>
            <span className="text-green-600">Delivered</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Skin Care Cream</span>
            <span className="text-yellow-500">In Transit</span>
          </div>

          <div className="flex justify-between">
            <span>Blood Pressure Monitor</span>
            <span className="text-blue-500">Processing</span>
          </div>

        </div>

      </div>

    </div>
    <Footer />
    </>
  );
};

export default Profile;

