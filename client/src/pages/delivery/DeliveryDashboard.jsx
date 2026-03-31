import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiPhone,
  FiMapPin,
  FiRefreshCw,
  FiSend,
  FiKey,
} from "react-icons/fi";
import { getMyAssignedOrders, generateOtp, verifyOtp } from "../../services/DeliveryService";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Processing: "bg-blue-100 text-blue-700",
  Shipped: "bg-indigo-100 text-indigo-700",
  "Out for Delivery": "bg-orange-100 text-orange-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getMyAssignedOrders();
      setOrders(res.data.orders || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOtpModal = (order) => {
    setSelectedOrder(order);
    setOtpValue("");
    setOtpSent(false);
    setShowOtpModal(true);
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setSelectedOrder(null);
    setOtpValue("");
    setOtpSent(false);
  };

  const handleGenerateOtp = async () => {
    if (!selectedOrder) return;
    try {
      setGeneratingOtp(true);
      await generateOtp(selectedOrder._id);
      setOtpSent(true);
      toast.success("OTP sent to customer's email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate OTP");
    } finally {
      setGeneratingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue.trim()) {
      toast.error("Please enter the OTP");
      return;
    }
    try {
      setOtpLoading(true);
      await verifyOtp(selectedOrder._id, otpValue.trim());
      toast.success("OTP verified! Order marked as Delivered.");
      closeOtpModal();
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const activeOrders = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");
  const deliveredOrders = orders.filter((o) => o.status === "Delivered");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Assigned Orders</h1>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <FiPackage className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Assigned</p>
            <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <FiTruck className="text-orange-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Orders</p>
            <p className="text-2xl font-bold text-gray-800">{activeOrders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full">
            <FiCheckCircle className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="text-2xl font-bold text-gray-800">{deliveredOrders.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-10 shadow text-center text-gray-500">
          <FiPackage size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No orders assigned yet</p>
          <p className="text-sm mt-1">The admin will assign orders to you soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-sm text-gray-500">#{order._id.slice(-8).toUpperCase()}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Customer */}
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FiUser size={14} />
                      <span>{order.shippingDetails?.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiPhone size={14} />
                      <span>{order.shippingDetails?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMapPin size={14} />
                      <span>
                        {order.shippingDetails?.address}, {order.shippingDetails?.city},{" "}
                        {order.shippingDetails?.state} - {order.shippingDetails?.zip}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Items</p>
                    <ul className="text-sm text-gray-700 space-y-0.5">
                      {order.items?.map((item, i) => (
                        <li key={i}>
                          {item.name} × {item.quantity}{" "}
                          <span className="text-gray-400">(₹{item.price})</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-2 text-sm font-semibold text-gray-800">
                    Total: ₹{order.totalAmount}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex flex-col gap-2 min-w-40">
                  {order.status === "Delivered" ? (
                    <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                      <FiCheckCircle size={18} />
                      Delivered
                    </div>
                  ) : (
                    <button
                      onClick={() => openOtpModal(order)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      <FiKey size={16} />
                      Confirm Delivery
                    </button>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <FiClock size={12} />
                    {new Date(order.updatedAt).toLocaleDateString("en-GB")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Confirm Delivery</h2>
            <p className="text-sm text-gray-500 mb-5">
              Order #{selectedOrder._id.slice(-8).toUpperCase()} —{" "}
              {selectedOrder.shippingDetails?.fullName}
            </p>

            {/* Step 1: Generate OTP */}
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <FiSend size={16} /> Step 1: Send OTP to Customer
              </p>
              <p className="text-xs text-blue-600 mb-3">
                Click the button below to send a 6-digit OTP to the customer's registered email.
              </p>
              <button
                onClick={handleGenerateOtp}
                disabled={generatingOtp}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {generatingOtp ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Sending OTP...
                  </>
                ) : otpSent ? (
                  "Resend OTP"
                ) : (
                  "Generate & Send OTP"
                )}
              </button>
              {otpSent && (
                <p className="text-xs text-green-600 mt-2 text-center">
                  OTP sent! Ask customer to check their email.
                </p>
              )}
            </div>

            {/* Step 2: Enter OTP */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiKey size={16} /> Step 2: Enter OTP from Customer
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Ask the customer for the OTP and enter it below to confirm delivery.
              </p>
              <input
                type="text"
                maxLength={6}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit OTP"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeOtpModal}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || otpValue.length !== 6}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={16} />
                    Verify & Mark Delivered
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
