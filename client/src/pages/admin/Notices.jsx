import { useEffect, useMemo, useState } from "react";
import {
  FiLoader,
  FiMail,
  FiSend,
  FiUsers,
  FiUser,
  FiCheck,
  FiSearch,
} from "react-icons/fi";
import {
  getUsers,
  getAdminDoctors,
  getDeliveryMen,
  getRecentNotices,
  sendNoticeEmails,
} from "../../services/AdminService.js";

const recipientTypeLabel = {
  users: "Users",
  doctors: "Doctors",
  "delivery-men": "Delivery Men",
};

const Notices = () => {
  const [scope, setScope] = useState("all");
  const [group, setGroup] = useState("users");
  const [recipientType, setRecipientType] = useState("users");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [recentNotices, setRecentNotices] = useState([]);

  const [recipientCounts, setRecipientCounts] = useState({
    users: 0,
    doctors: 0,
    "delivery-men": 0,
  });

  const [individualRecipients, setIndividualRecipients] = useState([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState([]);

  const fetchTypeRecipients = async (type) => {
    if (type === "users") {
      const response = await getUsers();
      return (response?.data || []).filter((item) => item?.email);
    }

    if (type === "doctors") {
      const response = await getAdminDoctors();
      return (response?.data || []).filter((item) => item?.email);
    }

    if (type === "delivery-men") {
      const response = await getDeliveryMen();
      return (response?.data?.deliveryMen || []).filter((item) => item?.email);
    }

    return [];
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoadingRecipients(true);
        const [usersResult, doctorsResult, deliveryResult] = await Promise.allSettled([
          fetchTypeRecipients("users"),
          fetchTypeRecipients("doctors"),
          fetchTypeRecipients("delivery-men"),
        ]);

        setRecipientCounts({
          users: usersResult.status === "fulfilled" ? usersResult.value.length : 0,
          doctors: doctorsResult.status === "fulfilled" ? doctorsResult.value.length : 0,
          "delivery-men": deliveryResult.status === "fulfilled" ? deliveryResult.value.length : 0,
        });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load recipients");
      } finally {
        setLoadingRecipients(false);
      }
    };

    fetchCounts();
  }, []);

  const fetchRecentMessages = async () => {
    try {
      setLoadingRecent(true);
      const response = await getRecentNotices();
      setRecentNotices(response?.data?.notices || []);
    } catch {
      // Keep notices area non-blocking if history fetch fails.
      setRecentNotices([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchRecentMessages();
  }, []);

  useEffect(() => {
    const fetchIndividuals = async () => {
      if (scope !== "individual") return;

      try {
        setLoadingRecipients(true);
        setError("");
        const recipients = await fetchTypeRecipients(recipientType);
        setIndividualRecipients(recipients);
        setSelectedRecipientIds([]);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load recipients");
        setIndividualRecipients([]);
      } finally {
        setLoadingRecipients(false);
      }
    };

    fetchIndividuals();
  }, [scope, recipientType]);

  const filteredRecipients = useMemo(() => {
    if (!searchTerm.trim()) return individualRecipients;

    const term = searchTerm.toLowerCase();
    return individualRecipients.filter(
      (recipient) =>
        recipient.name?.toLowerCase().includes(term) ||
        recipient.email?.toLowerCase().includes(term)
    );
  }, [individualRecipients, searchTerm]);

  const toggleRecipientSelection = (id) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredRecipients.map((recipient) => String(recipient._id));
    setSelectedRecipientIds(filteredIds);
  };

  const clearSelection = () => {
    setSelectedRecipientIds([]);
  };

  const handleSendNotice = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }

    if (scope === "individual" && selectedRecipientIds.length === 0) {
      setError("Please select at least one recipient");
      return;
    }

    try {
      setSending(true);
      const payload = {
        scope,
        subject: subject.trim(),
        message: message.trim(),
      };

      if (scope === "group") {
        payload.group = group;
      }

      if (scope === "individual") {
        payload.recipientType = recipientType;
        payload.recipientIds = selectedRecipientIds;
      }

      const response = await sendNoticeEmails(payload);
      const data = response?.data;

      setSuccess(
        `Notice sent. Total: ${data?.totalRecipients || 0}, Sent: ${data?.sentCount || 0}, Failed: ${data?.failedCount || 0}`
      );
      fetchRecentMessages();

      if (scope === "individual") {
        setSelectedRecipientIds([]);
      }
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send notice emails");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Notices</h1>
        <p className="text-gray-600 mt-2">
          Send announcements to all users, specific groups, or selected individuals.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <FiMail className="text-blue-600" />
            Compose Notice
          </h2>

          <form onSubmit={handleSendNotice} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Send To</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                    scope === "all"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  All Recipients
                </button>
                <button
                  type="button"
                  onClick={() => setScope("group")}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                    scope === "group"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  By Group
                </button>
                <button
                  type="button"
                  onClick={() => setScope("individual")}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                    scope === "individual"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Individual
                </button>
              </div>
            </div>

            {scope === "group" && (
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Recipient Group</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="users">Users</option>
                  <option value="doctors">Doctors</option>
                  <option value="delivery-men">Delivery Men</option>
                </select>
              </div>
            )}

            {scope === "individual" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Individual Type</label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="users">Users</option>
                    <option value="doctors">Doctors</option>
                    <option value="delivery-men">Delivery Men</option>
                  </select>
                </div>

                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Selected: <strong>{selectedRecipientIds.length}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto">
                  {loadingRecipients ? (
                    <div className="p-6 flex items-center justify-center text-gray-500 gap-2">
                      <FiLoader className="animate-spin" /> Loading recipients...
                    </div>
                  ) : filteredRecipients.length > 0 ? (
                    filteredRecipients.map((recipient) => {
                      const isSelected = selectedRecipientIds.includes(String(recipient._id));
                      return (
                        <button
                          type="button"
                          key={recipient._id}
                          onClick={() => toggleRecipientSelection(String(recipient._id))}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition flex items-start justify-between gap-3 ${
                            isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <div>
                            <p className="font-medium text-gray-900">{recipient.name || "Unnamed"}</p>
                            <p className="text-sm text-gray-600">{recipient.email}</p>
                          </div>
                          {isSelected && <FiCheck className="text-blue-600 mt-1" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-6 text-sm text-gray-500 text-center">No recipients found</div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter notice subject"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Message</label>
              <textarea
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your notice message here..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full md:w-auto px-6 py-3 rounded-lg bg-linear-to-r from-blue-500 to-blue-600 text-white font-medium hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <FiLoader className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <FiSend /> Send Notice
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiUsers className="text-indigo-600" /> Recipient Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
              <span className="text-gray-700">Users</span>
              <span className="font-semibold text-blue-700">{recipientCounts.users}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
              <span className="text-gray-700">Doctors</span>
              <span className="font-semibold text-green-700">{recipientCounts.doctors}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
              <span className="text-gray-700">Delivery Men</span>
              <span className="font-semibold text-amber-700">{recipientCounts["delivery-men"]}</span>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200 text-sm text-gray-600 space-y-2">
            <p className="font-medium text-gray-800 flex items-center gap-2">
              <FiUser /> Current Target
            </p>
            {scope === "all" && <p>All recipients across users, doctors, and delivery men.</p>}
            {scope === "group" && <p>{recipientTypeLabel[group]} only.</p>}
            {scope === "individual" && (
              <p>
                {recipientTypeLabel[recipientType]}: {selectedRecipientIds.length} selected.
              </p>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Recent Messages</h4>

            {loadingRecent ? (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <FiLoader className="animate-spin" /> Loading recent messages...
              </div>
            ) : recentNotices.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {recentNotices.map((notice) => (
                  <div
                    key={notice._id}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {notice.subject}
                      </p>
                      {String(notice.group || "") === "contact-us" ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                          Contact Us
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {notice.targetText || "Recipients"} | Sent {notice.sentCount}/
                      {notice.totalRecipients} | Failed {notice.failedCount}
                    </p>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2 whitespace-pre-wrap">
                      {notice.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      {new Date(notice.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent messages yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notices;
