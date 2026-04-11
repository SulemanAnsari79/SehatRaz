import { useEffect, useMemo, useState } from "react";
import api from "../../services/Api";

const ManageRefunds = () => {
  const [appointmentRefunds, setAppointmentRefunds] = useState([]);
  const [cancelRequests, setCancelRequests] = useState([]);
  const [codOrders, setCodOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState("PendingApproval");
  const [codStatusFilter, setCodStatusFilter] = useState("all");
  const [actionKey, setActionKey] = useState("");

  const [notesDraft, setNotesDraft] = useState({});
  const [payoutDraft, setPayoutDraft] = useState({});

  const authHeaders = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  const fetchRefundData = async () => {
    try {
      setLoading(true);
      setError("");

      const [apptRes, codRes, cancelRes] = await Promise.all([
        api.get(
          `/api/refund/admin/appointments${
            appointmentStatusFilter !== "all" ? `?status=${encodeURIComponent(appointmentStatusFilter)}` : ""
          }`,
          authHeaders
        ),
        api.get(
          `/api/refund/admin/cod-orders${
            codStatusFilter !== "all" ? `?status=${encodeURIComponent(codStatusFilter)}` : ""
          }`,
          authHeaders
        ),
        api.get("/api/order/cancel-requests?status=Requested", authHeaders),
      ]);

      setAppointmentRefunds(apptRes?.data?.appointments || []);
      setCodOrders(codRes?.data?.orders || []);
      setCancelRequests(cancelRes?.data?.orders || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load refund control data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundData();
  }, [appointmentStatusFilter, codStatusFilter]);

  const appointmentRows = useMemo(() => appointmentRefunds, [appointmentRefunds]);

  const codRows = useMemo(() => {
    if (codStatusFilter === "all") return codOrders;
    return codOrders.filter((order) => String(order?.codRefund?.status || "None") === codStatusFilter);
  }, [codOrders, codStatusFilter]);

  const setTransientSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 2500);
  };

  const decideCancelRequest = async (orderId, action) => {
    const draft = payoutDraft[orderId] || {};
    const key = `${orderId}-${action}`;

    try {
      setActionKey(key);
      setError("");
      await api.put(
        `/api/order/cancel-requests/${orderId}/${action}`,
        { adminNotes: String(draft.adminNotes || draft.reason || "").trim() },
        authHeaders
      );
      setTransientSuccess(`Cancellation request ${action}d successfully`);
      await fetchRefundData();
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to ${action} cancellation request`);
    } finally {
      setActionKey("");
    }
  };

  const decideAppointment = async (appointmentId, action) => {
    const notes = String(notesDraft[appointmentId] || "").trim();
    const key = `${appointmentId}-${action}`;

    try {
      setActionKey(key);
      setError("");
      await api.put(
        `/api/refund/admin/appointments/${appointmentId}/decision?action=${action}`,
        { adminNotes: notes },
        authHeaders
      );
      setTransientSuccess(`Appointment refund ${action}d successfully`);
      await fetchRefundData();
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to ${action} appointment refund`);
    } finally {
      setActionKey("");
    }
  };

  const requestCodRefund = async (orderId) => {
    const draft = payoutDraft[orderId] || {};
    const reason = String(draft.reason || "").trim();
    const amount = Number(draft.amount || 0);
    const key = `${orderId}-request`;

    try {
      setActionKey(key);
      setError("");
      await api.post(
        `/api/refund/admin/cod-orders/${orderId}/request`,
        {
          reason,
          amount: amount > 0 ? amount : undefined,
        },
        authHeaders
      );
      setTransientSuccess("COD refund requested successfully");
      await fetchRefundData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to request COD refund");
    } finally {
      setActionKey("");
    }
  };

  const decideCodRefund = async (orderId, action) => {
    const draft = payoutDraft[orderId] || {};
    const key = `${orderId}-${action}`;

    try {
      setActionKey(key);
      setError("");
      await api.put(
        `/api/refund/admin/cod-orders/${orderId}/decision?action=${action}`,
        {
          adminNotes: String(draft.adminNotes || "").trim(),
          payoutMethod: draft.payoutMethod,
          payoutReference: String(draft.payoutReference || "").trim(),
        },
        authHeaders
      );
      setTransientSuccess(`COD refund ${action}d successfully`);
      await fetchRefundData();
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to ${action} COD refund`);
    } finally {
      setActionKey("");
    }
  };

  if (loading) {
    return <div className="p-6">Loading refund control...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Refund Control</h1>
        <p className="text-gray-600 mt-1">
          Securely review appointment cancellation refunds and COD refund payouts.
        </p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div> : null}
      {success ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">{success}</div> : null}

      <section className="rounded-xl bg-white shadow p-4 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-semibold text-gray-900">Order Cancellation Requests</h2>
          <span className="text-sm text-gray-500">Pending approval queue</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Order ID</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Reason</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {cancelRequests.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={5}>No pending cancellation requests</td>
                </tr>
              ) : (
                cancelRequests.map((order) => {
                  const status = String(order?.cancelRequest?.status || "None");
                  return (
                    <tr key={order._id} className="border-t">
                      <td className="p-3">{order._id?.slice(0, 10)}...</td>
                      <td className="p-3">{order?.shippingDetails?.fullName || order?.user?.name || "N/A"}</td>
                      <td className="p-3">{status}</td>
                      <td className="p-3">{order?.cancelRequest?.reason || "N/A"}</td>
                      <td className="p-3">
                        <textarea
                          value={payoutDraft[order._id]?.adminNotes || ""}
                          onChange={(e) =>
                            setPayoutDraft((prev) => ({
                              ...prev,
                              [order._id]: {
                                ...prev[order._id],
                                adminNotes: e.target.value,
                              },
                            }))
                          }
                          placeholder="Admin note"
                          className="w-full border rounded p-2 mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            className="bg-green-600 text-white px-3 py-1 rounded disabled:bg-green-300"
                            disabled={actionKey === `${order._id}-approve`}
                            onClick={() => decideCancelRequest(order._id, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            className="bg-red-600 text-white px-3 py-1 rounded disabled:bg-red-300"
                            disabled={actionKey === `${order._id}-reject`}
                            onClick={() => decideCancelRequest(order._id, "reject")}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white shadow p-4 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-semibold text-gray-900">Appointment Refund Policy Queue</h2>
          <select
            value={appointmentStatusFilter}
            onChange={(e) => setAppointmentStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="PendingApproval">Pending Approval</option>
            <option value="Refunded">Refunded</option>
            <option value="Rejected">Rejected</option>
            <option value="Failed">Failed</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Patient</th>
                <th className="text-left p-3">Doctor</th>
                <th className="text-left p-3">Slot</th>
                <th className="text-left p-3">Policy</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {appointmentRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={7}>No appointment refunds found</td>
                </tr>
              ) : (
                appointmentRows.map((item) => {
                  const status = String(item?.refundControl?.status || "None");
                  const pending = status === "PendingApproval" || status === "Failed";

                  return (
                    <tr key={item._id} className="border-t">
                      <td className="p-3">{item?.user?.name || "N/A"}</td>
                      <td className="p-3">{item?.doctor?.name || "N/A"}</td>
                      <td className="p-3">{item?.date} {item?.time}</td>
                      <td className="p-3">{item?.refundControl?.policyPercent || 0}%</td>
                      <td className="p-3">Rs. {Number(item?.refundControl?.amount || 0).toFixed(2)}</td>
                      <td className="p-3">{status}</td>
                      <td className="p-3 space-y-2">
                        <textarea
                          value={notesDraft[item._id] || ""}
                          onChange={(e) => setNotesDraft((prev) => ({ ...prev, [item._id]: e.target.value }))}
                          placeholder="Admin note"
                          className="w-full border rounded p-2"
                        />
                        {pending ? (
                          <div className="flex gap-2">
                            <button
                              className="bg-green-600 text-white px-3 py-1 rounded disabled:bg-green-300"
                              disabled={actionKey === `${item._id}-approve`}
                              onClick={() => decideAppointment(item._id, "approve")}
                            >
                              Approve
                            </button>
                            <button
                              className="bg-red-600 text-white px-3 py-1 rounded disabled:bg-red-300"
                              disabled={actionKey === `${item._id}-reject`}
                              onClick={() => decideAppointment(item._id, "reject")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No action available</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white shadow p-4 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-semibold text-gray-900">COD Refund Control</h2>
          <select
            value={codStatusFilter}
            onChange={(e) => setCodStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All</option>
            <option value="Requested">Requested</option>
            <option value="Refunded">Refunded</option>
            <option value="Rejected">Rejected</option>
            <option value="Failed">Failed</option>
            <option value="None">None</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Order ID</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Order Status</th>
                <th className="text-left p-3">Payment Status</th>
                <th className="text-left p-3">COD Refund</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={6}>No COD refund items found</td>
                </tr>
              ) : (
                codRows.map((order) => {
                  const codRefundStatus = String(order?.codRefund?.status || "None");
                  const canRequest = codRefundStatus === "None" || codRefundStatus === "Rejected" || codRefundStatus === "Failed";
                  const canDecide = codRefundStatus === "Requested" || codRefundStatus === "Approved" || codRefundStatus === "Failed";
                  const draft = payoutDraft[order._id] || {};

                  return (
                    <tr key={order._id} className="border-t">
                      <td className="p-3">{order._id?.slice(0, 10)}...</td>
                      <td className="p-3">{order?.shippingDetails?.fullName || order?.user?.name || "N/A"}</td>
                      <td className="p-3">{order?.status}</td>
                      <td className="p-3">{order?.paymentStatus}</td>
                      <td className="p-3">
                        {codRefundStatus} (Rs. {Number(order?.codRefund?.amount || order?.totalAmount || 0).toFixed(2)})
                      </td>
                      <td className="p-3 space-y-2 min-w-72">
                        <input
                          type="text"
                          placeholder="Reason / Admin note"
                          value={draft.reason || draft.adminNotes || ""}
                          onChange={(e) =>
                            setPayoutDraft((prev) => ({
                              ...prev,
                              [order._id]: {
                                ...prev[order._id],
                                reason: e.target.value,
                                adminNotes: e.target.value,
                              },
                            }))
                          }
                          className="w-full border rounded p-2"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Amount"
                            value={draft.amount || ""}
                            onChange={(e) =>
                              setPayoutDraft((prev) => ({
                                ...prev,
                                [order._id]: { ...prev[order._id], amount: e.target.value },
                              }))
                            }
                            className="border rounded p-2"
                          />
                          <select
                            value={draft.payoutMethod || ""}
                            onChange={(e) =>
                              setPayoutDraft((prev) => ({
                                ...prev,
                                [order._id]: { ...prev[order._id], payoutMethod: e.target.value },
                              }))
                            }
                            className="border rounded p-2"
                          >
                            <option value="">Method</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank">Bank</option>
                            <option value="Cash">Cash</option>
                            <option value="Wallet">Wallet</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Reference"
                            value={draft.payoutReference || ""}
                            onChange={(e) =>
                              setPayoutDraft((prev) => ({
                                ...prev,
                                [order._id]: { ...prev[order._id], payoutReference: e.target.value },
                              }))
                            }
                            className="border rounded p-2"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {canRequest ? (
                            <button
                              className="bg-indigo-600 text-white px-3 py-1 rounded disabled:bg-indigo-300"
                              disabled={actionKey === `${order._id}-request`}
                              onClick={() => requestCodRefund(order._id)}
                            >
                              Request Refund
                            </button>
                          ) : null}

                          {canDecide ? (
                            <>
                              <button
                                className="bg-green-600 text-white px-3 py-1 rounded disabled:bg-green-300"
                                disabled={actionKey === `${order._id}-approve`}
                                onClick={() => decideCodRefund(order._id, "approve")}
                              >
                                Mark Refunded
                              </button>
                              <button
                                className="bg-red-600 text-white px-3 py-1 rounded disabled:bg-red-300"
                                disabled={actionKey === `${order._id}-reject`}
                                onClick={() => decideCodRefund(order._id, "reject")}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">No action available</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ManageRefunds;
