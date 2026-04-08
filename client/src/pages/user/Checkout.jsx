import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { user, token, cartItems, products, delivery_fee, currency, backendUrl, clearCart } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const normalizedBackendUrl = backendUrl.replace(/\/+$/, '');

  const [shipping, setShipping] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShipping({ ...shipping, [name]: value });
  };

  const handlePaymentChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  // Calculate cart total
  const getOrderItems = () => {
    const items = [];
    for (const itemId in cartItems) {
      const sizeMap = cartItems[itemId];
      const product = products.find((p) => p._id === itemId);
      if (!product) continue;
      for (const size in sizeMap) {
        const quantity = sizeMap[size];
        if (quantity > 0) {
          items.push({
            productId: itemId,
            name: product.name,
            price: product.price,
            quantity,
            size,
            image: Array.isArray(product.images) ? product.images[0] : product.images
          });
        }
      }
    }
    return items;
  };

  const orderItems = getOrderItems();
  const cartTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = cartTotal + delivery_fee;

  // Validate form
  const validateForm = () => {
    const { fullName, email, phone, address, city, state, country, zip } = shipping;
    
    if (!fullName.trim()) {
      toast.error("Full Name is required");
      return false;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email address");
      return false;
    }
    if (!phone.trim()) {
      toast.error("Phone Number is required");
      return false;
    }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      toast.error("Phone number must be 10 digits");
      return false;
    }
    if (!address.trim()) {
      toast.error("Address is required");
      return false;
    }
    if (!city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!state.trim()) {
      toast.error("State is required");
      return false;
    }
    if (!country.trim()) {
      toast.error("Country is required");
      return false;
    }
    if (!zip.trim()) {
      toast.error("ZIP Code is required");
      return false;
    }
    if (!/^\d{5,6}$/.test(zip)) {
      toast.error("ZIP Code must be 5-6 digits");
      return false;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return false;
    }
    if (orderItems.length === 0) {
      toast.error("Your cart is empty");
      return false;
    }
    return true;
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    if (!token) {
      toast.error("Please login to place an order");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      if (paymentMethod === "cod") {
        const response = await axios.post(
          `${normalizedBackendUrl}/api/order/placeorder`,
          {
            items: orderItems,
            paymentMethod: "Cash On Delivery",
            shippingDetails: shipping,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.data.success) {
          toast.error(response.data.message || "Failed to place order");
          return;
        }

        toast.success("Order placed successfully!");
        clearCart();
        setTimeout(() => {
          navigate("/place-order");
        }, 1200);
        return;
      }

      const sdkReady = await loadRazorpayScript();
      if (!sdkReady) {
        toast.error("Unable to load payment gateway. Please try again.");
        return;
      }

      const createPaymentOrder = await axios.post(
        `${normalizedBackendUrl}/api/order/create-online-order`,
        {
          items: orderItems,
          shippingDetails: shipping,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!createPaymentOrder.data.success) {
        toast.error(createPaymentOrder.data.message || "Failed to initialize payment");
        return;
      }

      const paymentOrder = createPaymentOrder.data;

      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "SehatRazz",
        description: "Secure checkout",
        order_id: paymentOrder.razorpayOrderId,
        prefill: {
          name: paymentOrder.customer?.name || shipping.fullName,
          email: paymentOrder.customer?.email || shipping.email,
          contact: paymentOrder.customer?.contact || shipping.phone,
        },
        notes: {
          app_order_id: paymentOrder.orderId,
        },
        theme: {
          color: "#111827",
        },
        handler: async function (rzpResponse) {
          try {
            const verify = await axios.post(
              `${normalizedBackendUrl}/api/order/verify-online-payment`,
              {
                orderId: paymentOrder.orderId,
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verify.data.success) {
              toast.success("Payment successful and verified!");
              clearCart();
              navigate("/place-order");
            } else {
              toast.error(verify.data.message || "Payment verification failed");
            }
          } catch (verifyError) {
            console.error("Verify payment error:", verifyError);
            toast.error(verifyError.response?.data?.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled by user");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Order error:", error);
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen p-6">
        <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Shipping & Payment Form */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Shipping Details</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="shipping-fullName" className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  id="shipping-fullName"
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={shipping.fullName}
                  onChange={handleChange}
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="shipping-email" className="text-sm font-medium text-gray-700">Email Address</label>
                <input
                  id="shipping-email"
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={shipping.email}
                  onChange={handleChange}
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="shipping-phone" className="text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  id="shipping-phone"
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={shipping.phone}
                  onChange={handleChange}
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="shipping-address" className="text-sm font-medium text-gray-700">Address</label>
                <input
                  id="shipping-address"
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={shipping.address}
                  onChange={handleChange}
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="shipping-city" className="text-sm font-medium text-gray-700">City</label>
                <input
                  id="shipping-city"
                  type="text"
                  name="city"
                  placeholder="City"
                  value={shipping.city}
                  onChange={handleChange}
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="shipping-state" className="text-sm font-medium text-gray-700">State</label>
                <input
                  id="shipping-state"
                  type="text"
                  name="state"
                  placeholder="State"
                  value={shipping.state}
                  onChange={handleChange}
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="shipping-country" className="text-sm font-medium text-gray-700">Country</label>
                <input
                  id="shipping-country"
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={shipping.country}
                  onChange={handleChange}
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="shipping-zip" className="text-sm font-medium text-gray-700">ZIP Code</label>
                <input
                  id="shipping-zip"
                  type="text"
                  name="zip"
                  placeholder="ZIP Code"
                  value={shipping.zip}
                  onChange={handleChange}
                  className="border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <h2 className="text-2xl font-semibold mt-6 mb-4">Payment Method</h2>

            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 border p-3 rounded cursor-pointer hover:shadow transition">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={handlePaymentChange}
                />
                <span>Cash On Delivery</span>
              </label>

              <label className="flex items-center gap-2 border p-3 rounded cursor-pointer hover:shadow transition">
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={handlePaymentChange}
                />
                <span>Online Payment (Card / UPI / Wallet)</span>
              </label>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-xl shadow space-y-4 h-fit">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            {/* Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {orderItems.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex justify-between text-sm border-b pb-2">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>{currency === "INR" ? "₹" : currency} {item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{currency === "INR" ? "₹" : currency} {cartTotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{currency === "INR" ? "₹" : currency} {delivery_fee}</span>
              </div>

              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{currency === "INR" ? "₹" : currency} {totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isLoading || orderItems.length === 0}
              className={`w-full bg-black text-white py-3 rounded-xl font-semibold mt-6 transition ${
                isLoading || orderItems.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
              }`}
            >
              {isLoading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Checkout;
