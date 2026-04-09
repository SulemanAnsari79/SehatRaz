import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiLoader } from "react-icons/fi";
import { createLeaveRequest, getMyLeaveRequests } from "../../services/DoctorService.js";

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [requestReason, setRequestReason] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMyLeaveRequests();
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

  const handleCreateLeaveRequest = async () => {
    if (!requestDate) {
      setError("Please select leave date first.");
      return;
    }

    if (!requestReason.trim()) {
      setError("Please provide a reason for leave.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await createLeaveRequest({ date: requestDate, reason: requestReason.trim() });
      setRequestDate("");
      setRequestReason("");
      await fetchRequests();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Leave Requests</h1>
        <p className="text-gray-600 mt-2">Send leave requests to admin and track approval status.</p>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <FiAlertCircle className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Request</h2>
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Date</label>
            <input
              type="date"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input
              type="text"
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="Reason for leave"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleCreateLeaveRequest}
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg h-fit"
          >
            {submitting ? "Sending..." : "Send Request"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Request History</h2>
          <button
            onClick={fetchRequests}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-600 inline-flex items-center gap-2">
            <FiLoader className="animate-spin" /> Loading leave requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">No leave requests yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((item) => (
              <div
                key={item._id}
                className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.date}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.reason}</p>
                  {item.adminNote ? (
                    <p className="text-xs text-gray-500 mt-1">Admin Note: {item.adminNote}</p>
                  ) : null}
                </div>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                    item.status === "Approved"
                      ? "bg-green-100 text-green-700"
                      : item.status === "Rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequests;
