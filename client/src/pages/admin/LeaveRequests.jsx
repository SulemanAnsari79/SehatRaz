import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiLoader } from "react-icons/fi";
import {
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "../../services/AdminService.js";

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getLeaveRequests();
      const payload = response?.data;
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.requests)
          ? payload.requests
          : [];
      setRequests(rows);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id) => {
    const adminNote = window.prompt("Optional admin note for approval:", "") ?? "";
    try {
      setActionLoadingId(id);
      const response = await approveLeaveRequest(id, adminNote);
      toast.success(response?.data?.message || "Leave request approved");
      await fetchRequests();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to approve leave request");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleReject = async (id) => {
    const adminNote = window.prompt("Optional rejection reason:", "") ?? "";
    try {
      setActionLoadingId(id);
      const response = await rejectLeaveRequest(id, adminNote);
      toast.success(response?.data?.message || "Leave request rejected");
      await fetchRequests();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reject leave request");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Doctor Leave Requests</h1>
          <p className="text-gray-600 mt-2">Approve requests to apply leave and auto-shift booked appointments.</p>
        </div>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-gray-600 inline-flex items-center gap-2">
            <FiLoader className="animate-spin" /> Loading leave requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">No leave requests available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Doctor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Reason</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id} className="border-b border-gray-100">
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <p className="font-medium">{request.doctor?.name || "Unknown doctor"}</p>
                      <p className="text-xs text-gray-500">{request.doctor?.email || "No email"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{request.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-sm">{request.reason}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          request.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : request.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {request.status === "Pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(request._id)}
                            disabled={actionLoadingId === request._id}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request._id)}
                            disabled={actionLoadingId === request._id}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequests;
