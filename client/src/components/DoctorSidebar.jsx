import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getDoctorAppointments, getDoctorProfile } from "../services/DoctorService.js";
// import { FiMenu } from "react-icons/fi";

const SEEN_BADGES_STORAGE_KEY = "doctor_sidebar_seen_badges";

const getInitialSeenCounts = () => {
  try {
    const raw = localStorage.getItem(SEEN_BADGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const DoctorSidebar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [badgeCounts, setBadgeCounts] = useState({
    appointments: 0,
    profile: 0,
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

  const fetchBadgeCounts = async () => {
    try {
      const [appointmentsRes, profileRes] = await Promise.all([
        getDoctorAppointments(),
        getDoctorProfile(),
      ]);

      const appointments = Array.isArray(appointmentsRes?.data?.appointments)
        ? appointmentsRes.data.appointments
        : [];

      const pendingStatuses = new Set(["pending", "scheduled", "booked"]);
      const appointmentCount = appointments.filter((apt) =>
        pendingStatuses.has(String(apt?.status || "").toLowerCase())
      ).length;

      const doctor = profileRes?.data?.doctor || {};
      const profileCount = doctor?.verified === false ? 1 : 0;

      setBadgeCounts({
        appointments: appointmentCount,
        profile: profileCount,
      });
    } catch {
      // Keep sidebar responsive even when count APIs fail.
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
    const intervalId = setInterval(fetchBadgeCounts, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/doctor" },
    { name: "Appointments", path: "/doctor/appointments", badgeKey: "appointments" },
    { name: "Patients", path: "/doctor/patients" },
    { name: "Profile", path: "/doctor/profile", badgeKey: "profile" },
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
        className={`fixed md:sticky md:top-0 top-0 left-0 h-screen w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 overflow-y-auto
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Header */}
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold text-blue-600">
            Doctor Panel
          </h2>
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

export default DoctorSidebar;
