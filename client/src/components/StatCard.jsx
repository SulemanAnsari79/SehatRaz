import { FiTrendingUp } from "react-icons/fi";

const StatCard = ({ title, value, icon, bgColor = "bg-blue-50", iconColor = "text-blue-600", trend = "" }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-300">
      {/* Header with Icon */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <div className={`text-xl ${iconColor}`}>
            {icon}
          </div>
        </div>
      </div>

      {/* Value and Trend */}
      <div className="flex items-baseline gap-2">
        <h2 className="text-3xl font-bold text-gray-900">{value}</h2>
        {trend && (
          <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
            <FiTrendingUp className="text-xs" />
            {trend}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-gray-500 text-xs mt-3">Compared to last month</p>
    </div>
  );
};

export default StatCard;
