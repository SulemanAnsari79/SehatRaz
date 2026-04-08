import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiHome, FiPackage, FiUser } from "react-icons/fi";
import { getDeliveryProfile, getMyAssignedOrders } from "../services/DeliveryService";

const SEEN_BADGES_STORAGE_KEY = "delivery_sidebar_seen_badges";

const getInitialSeenCounts = () => {
  try {
    const raw = localStorage.getItem(SEEN_BADGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const DeliverySidebar = () => {
  const location = useLocation();
  const [badgeCounts, setBadgeCounts] = useState({ orders: 0, profile: 0 });
  const [seenCounts, setSeenCounts] = useState(getInitialSeenCounts);

  const persistSeenCounts = (nextSeenCounts) => {
    try {
      localStorage.setItem(SEEN_BADGES_STORAGE_KEY, JSON.stringify(nextSeenCounts));
    } catch {
      // Ignore storage failures.
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

  const fetchBadgeCounts = async () => {
    try {
      const [ordersRes, profileRes] = await Promise.all([
        getMyAssignedOrders(),
        getDeliveryProfile(),
      ]);

      const orders = Array.isArray(ordersRes?.data?.orders) ? ordersRes.data.orders : [];
      const activeStatuses = new Set(["pending", "processing", "shipped", "out for delivery"]);
      const ordersCount = orders.filter((order) =>
        activeStatuses.has(String(order?.status || "").toLowerCase())
      ).length;

      const profile = profileRes?.data?.deliveryMan || {};
      const profileCount = profile?.isActive === false ? 1 : 0;

      setBadgeCounts({
        orders: ordersCount,
        profile: profileCount,
      });
    } catch {
      // Keep navigation functional if APIs fail.
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
    const intervalId = setInterval(fetchBadgeCounts, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/delivery", icon: <FiHome /> },
    { name: "My Orders", path: "/delivery/orders", icon: <FiPackage />, badgeKey: "orders" },
    { name: "Profile", path: "/delivery/profile", icon: <FiUser />, badgeKey: "profile" },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 min-h-screen bg-white shadow-lg">
      <div className="p-5 border-b">
        <h2 className="text-xl font-semibold text-gray-800">SehatRazz Delivery</h2>
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const visibleBadge = getVisibleBadgeCount(item.badgeKey);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => markBadgeAsSeen(item.badgeKey)}
              className={`flex items-center justify-between px-4 py-2 rounded-lg transition ${
                location.pathname === item.path
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-blue-100"
              }`}
            >
              <span className="flex items-center gap-3">
                {item.icon}
                {item.name}
              </span>
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
        })}
      </nav>
    </div>
  );
};

export default DeliverySidebar;
