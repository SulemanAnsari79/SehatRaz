import { useEffect, useState } from "react";
import { getStats, getUsers } from "../../services/AdminService.js";
import StatCard from "../../components/StatCard";
import { FiUsers, FiDollarSign, FiShoppingCart, FiCalendar, FiTrendingUp, FiLoader } from "react-icons/fi";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats from backend
        const statsResponse = await getStats();
        if (statsResponse?.data) {
          setStats(statsResponse.data);
        }

        // Fetch recent users
        const usersResponse = await getUsers();
        if (usersResponse?.data) {
          setRecentUsers(usersResponse.data.slice(0, 5));
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="text-4xl text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your business overview.</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={<FiUsers />}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
          trend="+12.5%"
        />
        <StatCard
          title="Total Doctors"
          value={stats.totalDoctors || 0}
          icon={<FiTrendingUp />}
          bgColor="bg-green-50"
          iconColor="text-green-600"
          trend="+8.2%"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={<FiShoppingCart />}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
          trend="+15.3%"
        />
        <StatCard
          title="Total Appointments"
          value={stats.totalAppointments || 0}
          icon={<FiCalendar />}
          bgColor="bg-orange-50"
          iconColor="text-orange-600"
          trend="+5.2%"
        />
        <StatCard
          title="Pending Appointments"
          value={stats.pendingAppointments || 0}
          icon={<FiCalendar />}
          bgColor="bg-yellow-50"
          iconColor="text-yellow-600"
          trend=""
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(stats.totalRevenue || 0).toLocaleString()}`}
          icon={<FiDollarSign />}
          bgColor="bg-indigo-50"
          iconColor="text-indigo-600"
          trend="+22.1%"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
            <p className="text-sm text-gray-500 mt-1">Latest registered users</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No recent users
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition">
              Manage Users
            </button>
            <button className="w-full px-4 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg transition">
              Manage Doctors
            </button>
            <button className="w-full px-4 py-3 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition">
              Manage Orders
            </button>
            <button className="w-full px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition">
              Manage Products
            </button>
          </div>

          {/* Stats Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Users:</span>
                <span className="font-medium text-gray-900">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Doctors:</span>
                <span className="font-medium text-gray-900">{stats.totalDoctors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Orders:</span>
                <span className="font-medium text-gray-900">{stats.totalOrders}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
