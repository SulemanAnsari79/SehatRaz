import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { toast } from "react-toastify";

const Cart = () => {
  const { products, cartItems, updateQuantity, currency, navigate,delivery_fee,getCartAmount } = useContext(AuthContext);

  const cartList = useMemo(() => {
    const items = [];
    for (const itemId in cartItems) {
      const sizeMap = cartItems[itemId];
      const product = products.find((p) => p._id === itemId);
      if (!product) continue;
      for (const size in sizeMap) {
        const quantity = sizeMap[size];
        if (quantity > 0) {
          const images = Array.isArray(product.images)
            ? product.images
            : Array.isArray(product.image)
              ? product.image
              : [product.images || product.image].filter(Boolean);

          items.push({
            key: `${itemId}-${size}`,
            itemId,
            size,
            quantity,
            product,
            image: images[0] || "/placeholder-image.jpg",
          });
        }
      }
    }
    return items;
  }, [cartItems, products]);

  const totalItems = cartList.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = getCartAmount();
  const deliveryFee = cartList.length > 0 ? delivery_fee : 0;
  const total = subtotal + deliveryFee;

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen p-6">
        <h1 className="text-3xl font-bold text-center mb-8">Your Cart</h1>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartList.length === 0 ? (
              <div className="bg-white p-10 rounded-lg shadow text-center">
                <p className="text-gray-500">Your cart is empty.</p>
                <Link
                  to="/products"
                  className="inline-block mt-4 bg-black text-white px-5 py-2 rounded"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              cartList.map((item) => (
                <div
                  key={item.key}
                  className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row gap-4 items-center"
                >
                  <img
                    src={item.image}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded"
                  />

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">Size: {item.size}</p>
                    <p className="text-green-600 font-bold">
                      {currency === "INR" ? "₹" : currency} {item.product.price}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        updateQuantity(item.itemId, item.size, Math.max(1, item.quantity - 1))
                      }
                      className="px-3 py-1 bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.itemId, item.size, item.quantity + 1)}
                      className="px-3 py-1 bg-gray-200 rounded"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => updateQuantity(item.itemId, item.size, 0)}
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
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="flex justify-between mb-2">
              <span>Total Items</span>
              <span>{totalItems}</span>
            </div>

            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>
                {currency === "INR" ? "₹" : currency} {subtotal}
              </span>
            </div>

            <div className="flex justify-between mb-4">
              <span>Delivery Fee</span>
              <span>
                {currency === "INR" ? "₹" : currency} {deliveryFee}
              </span>
            </div>

            <div className="flex justify-between mb-6 text-lg font-bold">
              <span>Total</span>
              <span>
                {currency === "INR" ? "₹" : currency} {total}
              </span>
            </div>

            <div className='w-full text-end'>
              <button onClick={() => cartList.length > 0 ? navigate('/checkout') : toast.error("Your cart is empty!")} className='bg-black text-white text-sm my-8 px-8 py-3 rounded-xl'>PROCEED TO CHECKOUT</button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Cart;
