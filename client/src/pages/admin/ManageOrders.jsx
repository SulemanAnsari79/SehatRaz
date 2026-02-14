import { useEffect, useState } from "react";
import { getOrders, updateOrderStatus } from "../../services/AdminService.js";
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
} from "react-icons/fi";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [formData, setFormData] = useState({
    status: "",
    paymentStatus: "",
    notes: "",
  });

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on search and filters
  useEffect(() => {
    let filtered = orders;

    // Filter by search term (order ID, customer email, phone)
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer?.phone?.includes(searchTerm) ||
          order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by order status
    if (filterStatus !== "all") {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }

    // Filter by payment status
    if (filterPayment !== "all") {
      filtered = filtered.filter((order) => order.paymentStatus === filterPayment);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, filterStatus, filterPayment]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOrders();
      setOrders(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-800",
          border: "border-yellow-200",
          badge: "bg-yellow-100 text-yellow-800",
        };
      case "processing":
        return {
          bg: "bg-blue-50",
          text: "text-blue-800",
          border: "border-blue-200",
          badge: "bg-blue-100 text-blue-800",
        };
      case "shipped":
        return {
          bg: "bg-purple-50",
          text: "text-purple-800",
          border: "border-purple-200",
          badge: "bg-purple-100 text-purple-800",
        };
      case "delivered":
        return {
          bg: "bg-green-50",
          text: "text-green-800",
          border: "border-green-200",
          badge: "bg-green-100 text-green-800",
        };
      case "cancelled":
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
      case "paid":
        return <FiCheckCircle className="text-green-600" />;
      case "pending":
        return <FiClock className="text-yellow-600" />;
      case "failed":
        return <FiAlertCircle className="text-red-600" />;
      default:
        return <FiDollarSign className="text-gray-600" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiClock />;
      case "processing":
        return <FiPackage />;
      case "shipped":
        return <FiTruck />;
      case "delivered":
        return <FiCheckCircle />;
      case "cancelled":
        return <FiX />;
      default:
        return <FiPackage />;
    }
  };

  const calculateTotal = (items) => {
    return items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  };

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
              {orders.filter(o => o.status === "pending").length}
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
                          <p className="font-medium text-gray-900">{order.customer?.name}</p>
                          <p className="text-gray-500 text-xs">{order.customer?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{calculateTotal(order.items).toFixed(2)}
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
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="View & Edit"
                        >
                          <FiEye size={18} />
                        </button>
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
                    <p className="text-gray-900 font-medium">{selectedOrder.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-gray-900 font-medium text-sm">{selectedOrder.customer?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="text-gray-900 font-medium">{selectedOrder.customer?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiMapPin className="text-indigo-600" />
                  Delivery Address
                </h3>
                <p className="text-gray-900 font-medium">{selectedOrder.shippingAddress?.address}</p>
                <p className="text-gray-600">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}{" "}
                  {selectedOrder.shippingAddress?.zipCode}
                </p>
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
                      ₹{calculateTotal(selectedOrder.items).toFixed(2)}
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
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
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
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
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
    </div>
  );
};

export default ManageOrders;
