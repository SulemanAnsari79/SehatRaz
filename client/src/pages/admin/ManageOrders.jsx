import { useEffect, useState } from "react";
import { getOrders, updateOrderStatus } from "../../services/AdminService.js";
import api from "../../services/Api";
import {
  FiSearch,
  FiEdit2,
  FiLoader,
  FiEye,
  FiFilter,
  FiDownload,
  FiX,
  FiCheck,
  FiClock,
  FiTruck,
  FiPackage,
  FiDollarSign,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiUserCheck,
} from "react-icons/fi";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [requestUpdatingKey, setRequestUpdatingKey] = useState("");
  const [formData, setFormData] = useState({
    status: "",
    paymentStatus: "",
    notes: "",
  });

  // Delivery man assignment state
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignOrderId, setAssignOrderId] = useState(null);
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
    fetchDeliveryMen();
  }, []);

  // Filter orders based on search and filters
  useEffect(() => {
    let filtered = orders;

    // Filter by search term (order ID, customer email, phone)
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.shippingDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.shippingDetails?.phone?.includes(searchTerm) ||
          order.shippingDetails?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by order status
    if (filterStatus !== "all") {
      filtered = filtered.filter((order) => order.status?.toLowerCase() === filterStatus.toLowerCase());
    }

    // Filter by payment status
    if (filterPayment !== "all") {
      filtered = filtered.filter((order) => order.paymentStatus?.toLowerCase() === filterPayment.toLowerCase());
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, filterStatus, filterPayment]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOrders();
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryMen = async () => {
    try {
      const res = await api.get("/api/admin/delivery-men", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDeliveryMen(res.data.deliveryMen || []);
    } catch (err) {
      console.error("Fetch delivery men error:", err);
    }
  };

  const openAssignModal = (orderId) => {
    setAssignOrderId(orderId);
    setSelectedDeliveryMan("");
    setShowAssignModal(true);
  };

  const handleAssignOrder = async () => {
    if (!selectedDeliveryMan) return;
    try {
      setAssigning(true);
      await api.put(
        `/api/admin/assign-order/${assignOrderId}`,
        { deliveryManId: selectedDeliveryMan },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setShowAssignModal(false);
      setError(null);
      setSuccessMessage("Order assigned to delivery man successfully. Status will be updated by delivery staff.");
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign order");
    } finally {
      setAssigning(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setFormData({
      status: order.status || "",
      paymentStatus: order.paymentStatus || "",
      notes: order.notes || "",
    });
    setShowModal(true);
  };

  const handleUpdateOrder = async () => {
    try {
      setUpdatingOrder(selectedOrder._id);
      await updateOrderStatus(selectedOrder._id, {
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes,
      });
      setOrders(
        orders.map((order) =>
          order._id === selectedOrder._id
            ? { ...order, ...formData }
            : order
        )
      );
      setShowModal(false);
      setSelectedOrder(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRequestAction = async (orderId, requestType, actionType) => {
    const actionKey = `${orderId}-${requestType}-${actionType}`;
    try {
      setRequestUpdatingKey(actionKey);
      setError(null);
      setSuccessMessage(null);

      const response = await api.put(
        `/api/order/${orderId}/${requestType}/${actionType}`,
        { adminNotes: "Updated from Manage Orders" },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (response?.data?.success) {
        setSuccessMessage(response.data.message || "Request updated successfully");
        await fetchOrders();
        setTimeout(() => setSuccessMessage(null), 2500);
      } else {
        setError(response?.data?.message || "Failed to update request");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update request");
    } finally {
      setRequestUpdatingKey("");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-800",
          border: "border-yellow-200",
          badge: "bg-yellow-100 text-yellow-800",
        };
      case "Processing":
        return {
          bg: "bg-blue-50",
          text: "text-blue-800",
          border: "border-blue-200",
          badge: "bg-blue-100 text-blue-800",
        };
      case "Shipped":
        return {
          bg: "bg-purple-50",
          text: "text-purple-800",
          border: "border-purple-200",
          badge: "bg-purple-100 text-purple-800",
        };
      case "Delivered":
        return {
          bg: "bg-green-50",
          text: "text-green-800",
          border: "border-green-200",
          badge: "bg-green-100 text-green-800",
        };
      case "Cancelled":
        return {
          bg: "bg-red-50",
          text: "text-red-800",
          border: "border-red-200",
          badge: "bg-red-100 text-red-800",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          border: "border-gray-200",
          badge: "bg-gray-100 text-gray-800",
        };
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case "Paid":
        return <FiCheckCircle className="text-green-600" />;
      case "Pending":
        return <FiClock className="text-yellow-600" />;
      case "Failed":
        return <FiAlertCircle className="text-red-600" />;
      default:
        return <FiDollarSign className="text-gray-600" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <FiClock />;
      case "Processing":
        return <FiPackage />;
      case "Shipped":
        return <FiTruck />;
      case "Delivered":
        return <FiCheckCircle />;
      case "Cancelled":
        return <FiX />;
      default:
        return <FiPackage />;
    }
  };

  // const calculateTotal = (items) => {
  //   return items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="text-4xl text-indigo-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Our Orders</h1>
          <p className="text-gray-600 mt-2">
            Total Orders: <span className="font-semibold text-indigo-600">{orders.length}</span>
            <span className="mx-2 text-gray-400">•</span>
            Pending: <span className="font-semibold text-yellow-600">
              {orders.filter(o => o.status?.toLowerCase() === "pending").length}
            </span>
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Email, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="out for delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Filter by Payment */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Payment</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Order List</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredOrders.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const statusColor = getStatusColor(order.status);
                  return (
                    <tr
                      key={order._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-semibold text-gray-900">
                          #{order._id?.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{order.shippingDetails?.fullName}</p>
                          <p className="text-gray-500 text-xs">{order.shippingDetails?.email}</p>
                          {order.assignedTo ? (
                            <p className="text-gray-500 text-xs mt-1">
                              Delivery Man: <span className="font-medium text-gray-700">{order.assignedTo.name || "Assigned"}</span>
                            </p>
                          ) : (
                            <p className="text-gray-400 text-xs mt-1">Delivery Man: Not assigned</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{order.totalAmount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusColor.badge}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status?.charAt(0).toUpperCase() +
                            order.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getPaymentStatusIcon(order.paymentStatus)}
                          <span className="text-sm text-gray-600">
                            {order.paymentStatus?.charAt(0).toUpperCase() +
                              order.paymentStatus?.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View & Edit"
                          >
                            <FiEye size={18} />
                          </button>

                          {/* Assign to Delivery Man button */}
                          {!["Delivered", "Cancelled"].includes(order.status) && (
                            <button
                              onClick={() => openAssignModal(order._id)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                              title="Assign to Delivery Man"
                            >
                              <FiUserCheck size={18} />
                            </button>
                          )}

                          {order.returnRequest?.status === "Requested" && (
                            <>
                              <button
                                onClick={() => handleRequestAction(order._id, "return", "approve")}
                                disabled={requestUpdatingKey === `${order._id}-return-approve`}
                                className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50"
                              >
                                Return ✓
                              </button>
                              <button
                                onClick={() => handleRequestAction(order._id, "return", "reject")}
                                disabled={requestUpdatingKey === `${order._id}-return-reject`}
                                className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                              >
                                Return ✕
                              </button>
                            </>
                          )}

                          {order.replaceRequest?.status === "Requested" && (
                            <>
                              <button
                                onClick={() => handleRequestAction(order._id, "replace", "approve")}
                                disabled={requestUpdatingKey === `${order._id}-replace-approve`}
                                className="px-2 py-1 text-xs rounded bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50"
                              >
                                Exchange ✓
                              </button>
                              <button
                                onClick={() => handleRequestAction(order._id, "replace", "reject")}
                                disabled={requestUpdatingKey === `${order._id}-replace-reject`}
                                className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                              >
                                Exchange ✕
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 font-medium">
                {searchTerm || filterStatus !== "all" || filterPayment !== "all"
                  ? "No orders found matching your criteria"
                  : "No orders yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-linear-to-r from-indigo-500 to-indigo-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Order Details</h2>
                <p className="text-indigo-100 text-sm mt-1">#{selectedOrder._id}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:opacity-80 transition"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiUser className="text-indigo-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="text-gray-900 font-medium">{selectedOrder.shippingDetails?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-gray-900 font-medium text-sm">{selectedOrder.shippingDetails?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="text-gray-900 font-medium">{selectedOrder.shippingDetails?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiMapPin className="text-indigo-600" />
                  Delivery Address
                </h3>
                <p className="text-gray-900 font-medium">{selectedOrder.shippingDetails?.address}</p>
                <p className="text-gray-600">
                  {selectedOrder.shippingDetails?.city}, {selectedOrder.shippingDetails?.state}{" "}
                  {selectedOrder.shippingDetails?.zip}
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiTruck className="text-indigo-600" />
                  Delivery Assignment
                </h3>
                {selectedOrder.assignedTo ? (
                  <div className="space-y-1 text-sm text-gray-700">
                    <p className="font-medium">{selectedOrder.assignedTo.name || "Assigned Delivery Man"}</p>
                    <p>{selectedOrder.assignedTo.email || "No email"}</p>
                    <p>{selectedOrder.assignedTo.phone || "No phone"}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No delivery man assigned yet.</p>
                )}
              </div>

              {/* Order Items */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiPackage className="text-indigo-600" />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="text-gray-900 font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-gray-900 font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t-2 border-indigo-500">
                    <p className="text-lg font-bold text-gray-900">Total Amount:</p>
                    <p className="text-lg font-bold text-indigo-600">
                      ₹{selectedOrder.totalAmount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Status & Updates */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiClock className="text-indigo-600" />
                  Order Status & Payment
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Order Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Payment Status
                    </label>
                    <select
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add any notes about this order..."
                  />
                </div>
              </div>

              {/* Order Timeline */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                      <div className="w-0.5 h-12 bg-gray-200 my-2"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Order Created</p>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.updatedAt && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Last Updated</p>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedOrder.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Close
              </button>
              <button
                onClick={handleUpdateOrder}
                disabled={updatingOrder === selectedOrder._id}
                className="px-6 py-2.5 bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {updatingOrder === selectedOrder._id && (
                  <FiLoader className="animate-spin" size={16} />
                )}
                Update Order
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Assign Delivery Man Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiTruck className="text-orange-500" />
                Assign Delivery Man
              </h2>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={22} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Assigning this order will keep its current status. The delivery man can mark it as <strong>Out for Delivery</strong>.
            </p>
            {deliveryMen.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                No active delivery men found. Create one first.
              </p>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Delivery Man</label>
                <select
                  value={selectedDeliveryMan}
                  onChange={(e) => setSelectedDeliveryMan(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 mb-5"
                >
                  <option value="">-- Choose delivery man --</option>
                  {deliveryMen.filter(dm => dm.isActive).map((dm) => (
                    <option key={dm._id} value={dm._id}>
                      {dm.name} — {dm.phone}
                    </option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-100 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignOrder}
                    disabled={!selectedDeliveryMan || assigning}
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {assigning ? (
                      <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Assigning...</>
                    ) : (
                      <><FiUserCheck size={16} /> Assign</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
