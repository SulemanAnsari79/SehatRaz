import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  getAppointments,
  getDoctors,
  getLeaveRequests,
  getOrders,
  getRecentNotices,
  getUsers,
} from "../services/AdminService.js";
// import { FiMenu } from "react-icons/fi";

const SEEN_BADGES_STORAGE_KEY = "admin_sidebar_seen_badges";

const getInitialSeenCounts = () => {
  try {
    const raw = localStorage.getItem(SEEN_BADGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const AdminSidebar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [badgeCounts, setBadgeCounts] = useState({
    users: 0,
    doctors: 0,
    appointments: 0,
    leaveRequests: 0,
    orders: 0,
    orderRequests: 0,
    refunds: 0,
    notices: 0,
  });
  const [seenCounts, setSeenCounts] = useState(getInitialSeenCounts);

  const persistSeenCounts = (nextSeenCounts) => {
    try {
      localStorage.setItem(SEEN_BADGES_STORAGE_KEY, JSON.stringify(nextSeenCounts));
    } catch {
      // Ignore storage write failures.
    }
  };

  const markBadgeAsSeen = (badgeKey) => {
    if (!badgeKey) return;

    setSeenCounts((prev) => {
      const next = {
        ...prev,
        [badgeKey]: badgeCounts?.[badgeKey] || 0,
      };
      persistSeenCounts(next);
      return next;
    });
  };

  const getVisibleBadgeCount = (badgeKey) => {
    if (!badgeKey) return 0;
    const total = Number(badgeCounts?.[badgeKey] || 0);
    const seen = Number(seenCounts?.[badgeKey] || 0);
    return Math.max(0, total - seen);
  };

  const extractArray = (payload, preferredKeys = []) => {
    if (Array.isArray(payload)) return payload;
    for (const key of preferredKeys) {
      if (Array.isArray(payload?.[key])) return payload[key];
    }
    if (payload && typeof payload === "object") {
      const firstArrayKey = Object.keys(payload).find((key) => Array.isArray(payload[key]));
      return firstArrayKey ? payload[firstArrayKey] : [];
    }
    return [];
  };

  const fetchBadgeCounts = async () => {
    try {
      const [usersRes, doctorsRes, appointmentsRes, leaveReqRes, ordersRes, noticesRes] = await Promise.all([
        getUsers(),
        getDoctors(),
        getAppointments(),
        getLeaveRequests("Pending"),
        getOrders(),
        getRecentNotices(),
      ]);

      const users = extractArray(usersRes?.data, ["users"]);
      const doctors = extractArray(doctorsRes?.data, ["doctors"]);
      const appointments = extractArray(appointmentsRes?.data, ["appointments"]);
      const leaveRequests = extractArray(leaveReqRes?.data, ["requests"]);
      const orders = extractArray(ordersRes?.data, ["orders"]);
      const notices = extractArray(noticesRes?.data, ["notices"]);

      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const usersNewCount = users.filter((item) => {
        const ts = new Date(item?.createdAt || 0).getTime();
        return ts && ts >= threeDaysAgo;
      }).length;

      const doctorVerificationCount = doctors.filter((item) => item?.verified === false).length;

      const appointmentStatuses = new Set(["pending", "scheduled", "booked"]);
      const appointmentsPendingCount = appointments.filter((item) =>
        appointmentStatuses.has(String(item?.status || "").toLowerCase())
      ).length;

      const leaveRequestsPendingCount = leaveRequests.filter(
        (item) => String(item?.status || "").toLowerCase() === "pending"
      ).length;

      const activeOrderStatuses = new Set(["pending", "processing", "out for delivery"]);
      const ordersActiveCount = orders.filter((item) =>
        activeOrderStatuses.has(String(item?.status || "").toLowerCase())
      ).length;

      const orderRequestsCount = orders.reduce((acc, order) => {
        const isReturnRequested = String(order?.returnRequest?.status || "") === "Requested";
        const isReplaceRequested = String(order?.replaceRequest?.status || "") === "Requested";
        const isCancelRequested = String(order?.cancelRequest?.status || "") === "Requested";
        return acc + (isReturnRequested ? 1 : 0) + (isReplaceRequested ? 1 : 0) + (isCancelRequested ? 1 : 0);
      }, 0);

      const appointmentRefundCount = appointments.filter(
        (item) =>
          String(item?.status || "") === "Cancelled" &&
          String(item?.refundControl?.status || "") === "PendingApproval"
      ).length;

      const codRefundCount = orders.filter(
        (item) => String(item?.codRefund?.status || "") === "Requested"
      ).length;

      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentNoticesCount = notices.filter((item) => {
        const ts = new Date(item?.createdAt || 0).getTime();
        return ts && ts >= oneDayAgo;
      }).length;

      setBadgeCounts({
        users: usersNewCount,
        doctors: doctorVerificationCount,
        appointments: appointmentsPendingCount,
        leaveRequests: leaveRequestsPendingCount,
        orders: ordersActiveCount,
        orderRequests: orderRequestsCount,
        refunds: appointmentRefundCount + codRefundCount,
        notices: recentNoticesCount,
      });
    } catch {
      // Keep navigation usable if badge APIs fail.
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
    const intervalId = setInterval(fetchBadgeCounts, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Users", path: "/admin/users", badgeKey: "users" },
    { name: "Doctors", path: "/admin/doctors", badgeKey: "doctors" },
    { name: "Appointments", path: "/admin/appointments", badgeKey: "appointments" },
    { name: "Leave Requests", path: "/admin/leave-requests", badgeKey: "leaveRequests" },
    { name: "Products", path: "/admin/products" },
    { name: "Orders", path: "/admin/orders", badgeKey: "orders" },
    { name: "Order Requests", path: "/admin/order-requests", badgeKey: "orderRequests" },
    { name: "Refund Control", path: "/admin/refunds", badgeKey: "refunds" },
    { name: "Notices", path: "/admin/notices", badgeKey: "notices" },
    { name: "Delivery Men", path: "/admin/delivery-men" },
    { name: "Location Control", path: "/admin/location-control" },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded shadow"
      >
        {/* <FiMenu size={22} /> */}
      </button>

      {/* Overlay (Mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 overflow-y-auto
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Header */}
        {/* <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">SehatRazz Admin</h1>
          </div> */}
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold">SehatRaz Admin Panel</h2>
        </div>

        {/* Links */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            (() => {
              const visibleBadge = getVisibleBadgeCount(item.badgeKey);
              return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                setOpen(false);
                markBadgeAsSeen(item.badgeKey);
              }}
              className={`flex items-center justify-between px-4 py-2 rounded-lg transition
              ${
                location.pathname === item.path
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-blue-100"
              }`}
            >
              <span>{item.name}</span>
              {visibleBadge > 0 ? (
                <span
                  className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    location.pathname === item.path
                      ? "bg-white text-blue-600"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {visibleBadge > 99 ? "99+" : visibleBadge}
                </span>
              ) : null}
            </Link>
              );
            })()
          ))}
        </nav>
      </div>
    </>
  );
};

export default AdminSidebar;