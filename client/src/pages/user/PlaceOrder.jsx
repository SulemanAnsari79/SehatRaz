import React from "react";
import { Link } from "react-router-dom";

const PlaceOrder = () => {

  // Mock order details
  const order = {
    id: "ORD123456",
    items: [
      { name: "Vitamin C Tablets", qty: 1, price: 299 },
      { name: "Skin Care Cream", qty: 2, price: 499 },
    ],
    total: 1297,
    shipping: {
      name: "Muhammad Suleman",
      address: "New Delhi, India",
      phone: "+91 98765 43210",
    },
    paymentMethod: "Credit / Debit Card",
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">

      {/* Confirmation Section */}
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          🎉 Order Placed Successfully!
        </h1>
        <p className="text-gray-600 mb-2">
          Your Order ID: <span className="font-semibold">{order.id}</span>
        </p>
        <p className="text-gray-600 mb-6">
          Thank you for shopping with Sehatraz.
        </p>

        <Link to="/products">
          <button className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600">
            Continue Shopping
          </button>
        </Link>
      </div>

      {/* Order Summary */}
      <div className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">

        <h2 className="text-2xl font-semibold mb-4">Order Details</h2>

        <div className="space-y-3">

          {/* Items */}
          <div className="border-b pb-3">
            <h3 className="font-semibold mb-2">Products</h3>
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between text-gray-700"
              >
                <span>{item.name} x {item.qty}</span>
                <span>₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>

          {/* Shipping */}
          <div className="border-b pb-3">
            <h3 className="font-semibold mb-2">Shipping Info</h3>
            <p>{order.shipping.name}</p>
            <p>{order.shipping.address}</p>
            <p>{order.shipping.phone}</p>
          </div>

          {/* Payment */}
          <div className="border-b pb-3">
            <h3 className="font-semibold mb-2">Payment Method</h3>
            <p>{order.paymentMethod}</p>
          </div>

          {/* Total */}
          <div className="flex justify-between font-bold text-lg mt-3">
            <span>Total Amount</span>
            <span>₹{order.total}</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PlaceOrder;
