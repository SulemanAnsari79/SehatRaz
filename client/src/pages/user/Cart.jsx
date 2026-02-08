import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";

const Cart = () => {

  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Vitamin C Tablets",
      price: 299,
      quantity: 1,
      image: "/p1.jpg",
    },
    {
      id: 2,
      name: "Skin Care Cream",
      price: 499,
      quantity: 2,
      image: "/p2.jpg",
    },
  ]);

  // Increase Quantity
  const increaseQty = (id) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease Quantity
  const decreaseQty = (id) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  // Remove Item
  const removeItem = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  // Total Price
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">

      <h1 className="text-3xl font-bold text-center mb-8">
        Your Cart
      </h1>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">

        {/* Cart Items */}
        <div className="md:col-span-2 space-y-6">

          {cartItems.length === 0 ? (
            <p className="text-center text-gray-500">
              Your cart is empty.
            </p>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row gap-4 items-center"
              >

                {/* Image */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded"
                />

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold">
                    {item.name}
                  </h3>
                  <p className="text-green-600 font-bold">
                    ₹{item.price}
                  </p>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => decreaseQty(item.id)}
                    className="px-3 py-1 bg-gray-200 rounded"
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() => increaseQty(item.id)}
                    className="px-3 py-1 bg-gray-200 rounded"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:underline"
                >
                  Remove
                </button>

              </div>
            ))
          )}

        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow h-fit">

          <h2 className="text-xl font-semibold mb-4">
            Order Summary
          </h2>

          <div className="flex justify-between mb-2">
            <span>Total Items</span>
            <span>{cartItems.length}</span>
          </div>

          <div className="flex justify-between mb-4">
            <span>Total Price</span>
            <span className="font-bold">₹{totalPrice}</span>
          </div>

          <Link to={'/checkout'} className="w-full bg-green-500 text-white px-2 py-3 rounded hover:bg-green-600">
            Proceed to Checkout
          </Link>

        </div>

      </div>

    </div>
  );
};

export default Cart;
