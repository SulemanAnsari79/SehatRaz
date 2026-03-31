import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/Api";

const ManageOrderRequests = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("Requested");

  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [actionType, setActionType] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/order/orders", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response?.data?.success) {
        setOrders(response.data.orders || []);
      } else {
        setError(response?.data?.message || "Failed to load order requests");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load order requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const requestRows = useMemo(() => {
    return orders.flatMap((order) => {
      const rows = [];

      if (
        (filterType === "all" || filterType === "return") &&
        order.returnRequest?.status === filterStatus
      ) {
        rows.push({
          key: `${order._id}-return`,
          order,
          requestType: "return",
          request: order.returnRequest,
        });
      }

      if (
        (filterType === "all" || filterType === "replace") &&
        order.replaceRequest?.status === filterStatus
      ) {
        rows.push({
          key: `${order._id}-replace`,
          order,
          requestType: "replace",
          request: order.replaceRequest,
        });
      }

      return rows;
    });
  }, [orders, filterType, filterStatus]);

  const openActionModal = (row, action) => {
    setSelectedRow(row);
    setActionType(action);
    setAdminNotes("");
    setShowModal(true);
  };

  const submitAction = async () => {
    if (!selectedRow) return;

    const { order, requestType } = selectedRow;
    const endpoint = `/api/order/${order._id}/${requestType}/${actionType}`;
    const loadingKey = `${order._id}-${requestType}`;

    try {
      setActionLoading((prev) => ({ ...prev, [loadingKey]: true }));

      const response = await api.put(
        endpoint,
        { adminNotes },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (response?.data?.success) {
        setSuccessMessage(response.data.message || "Request updated successfully");
        setShowModal(false);
        setSelectedRow(null);
        setAdminNotes("");
        await fetchOrders();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response?.data?.message || "Failed to update request");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update request");
    } finally {
      setActionLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Manage Return & Exchange Requests</h1>
          <p className="text-gray-600 mt-2">Review and approve/reject customer requests</p>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white p-4 rounded-xl shadow mb-6 flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Request Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded-lg p-2"
            >
              <option value="all">All Requests</option>
              <option value="return">Return Requests</option>
              <option value="replace">Exchange Requests</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg p-2"
            >
              <option value="Requested">Requested</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading requests...</p>
            </div>
          ) : requestRows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Request Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Reason</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requestRows.map((row) => {
                    const { order, requestType, request, key } = row;
                    const loadingKey = `${order._id}-${requestType}`;

                    return (
                      <tr key={key} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                          {order._id?.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.user?.name || order.shippingDetails?.fullName || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              requestType === "return"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-violet-100 text-violet-700"
                            }`}
                          >
                            {requestType === "return" ? "Return" : "Exchange"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{request?.reason || "N/A"}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              request?.status === "Requested"
                                ? "bg-yellow-100 text-yellow-700"
                                : request?.status === "Approved"
                                ? "bg-green-100 text-green-700"
                                : request?.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {request?.status || "None"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {request?.status === "Requested" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => openActionModal(row, "approve")}
                                disabled={actionLoading[loadingKey]}
                                className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition disabled:bg-green-300"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openActionModal(row, "reject")}
                                disabled={actionLoading[loadingKey]}
                                className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition disabled:bg-red-300"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No action</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {actionType === "approve" ? "Approve" : "Reject"} Request
            </h2>

            <div className="mb-4 text-sm text-gray-700 space-y-1">
              <p>
                <strong>Order ID:</strong> {selectedRow.order._id?.substring(0, 8)}...
              </p>
              <p>
                <strong>Request Type:</strong> {selectedRow.requestType === "return" ? "Return" : "Exchange"}
              </p>
              <p>
                <strong>Reason:</strong> {selectedRow.request?.reason || "N/A"}
              </p>
            </div>

            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add admin notes (optional)..."
              className="w-full border rounded-lg p-3 mb-4 h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRow(null);
                  setAdminNotes("");
                }}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Close
              </button>
              <button
                onClick={submitAction}
                className={`flex-1 text-white px-4 py-2 rounded-lg transition ${
                  actionType === "approve"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrderRequests;
