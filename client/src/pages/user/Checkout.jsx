import React, { useState } from "react";
import { Link } from "react-router-dom";

const Checkout = () => {
  const [shipping, setShipping] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

// onlclick={()=>nav("/")}

  const handleChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        Checkout
      </h1>

      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">

        {/* Shipping & Payment Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow space-y-6">

          <h2 className="text-2xl font-semibold mb-4">Shipping Details</h2>

          <div className="grid sm:grid-cols-2 gap-4">

            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={shipping.fullName}
              onChange={handleChange}
              className="border p-3 rounded w-full"
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={shipping.email}
              onChange={handleChange}
              className="border p-3 rounded w-full"
            />

            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={shipping.phone}
              onChange={handleChange}
              className="border p-3 rounded w-full"
            />

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={shipping.address}
              onChange={handleChange}
              className="border p-3 rounded w-full"
            />

            <input
              type="text"
              name="city"
              placeholder="City"
              value={shipping.city}
              onChange={handleChange}
              className="border p-3 rounded w-full"
            />

            <input
              type="text"
              name="state"
              placeholder="State"
              value={shipping.state}
              onChange={handleChange}
              className="border p-3 rounded w-full"
            />

            <input
              type="text"
              name="zip"
              placeholder="ZIP Code"
              value={shipping.zip}
              onChange={handleChange}
              className="border p-3 rounded w-full"
            />

          </div>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Payment Method</h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2 border p-3 rounded cursor-pointer hover:shadow">
              <input type="radio" name="payment" />
              Credit / Debit Card
            </label>

            <label className="flex items-center gap-2 border p-3 rounded cursor-pointer hover:shadow">
              <input type="radio" name="payment" />
              UPI / Wallet
            </label>
          </div>

        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4 h-fit">

          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          <div className="flex justify-between">
            <span>Items Total</span>
            <span>₹2,097</span>
          </div>

          <div className="flex justify-between">
            <span>Shipping</span>
            <span>₹100</span>
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>₹2,197</span>
          </div>

          <Link to={'/placeorder'} className="w-full bg-green-500 text-white py-3 rounded hover:bg-green-600 mt-4">
            Place Order
          </Link>

        </div>

      </div>

    </div>
  );
};

export default Checkout;
