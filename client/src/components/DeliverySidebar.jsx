import { Link, useLocation } from "react-router-dom";
import { FiHome, FiPackage } from "react-icons/fi";

const DeliverySidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/delivery", icon: <FiHome /> },
    { name: "My Orders", path: "/delivery/orders", icon: <FiPackage /> },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 min-h-screen bg-white shadow-lg">
      <div className="p-5 border-b">
        <h2 className="text-xl font-semibold text-gray-800">SehatRazz Delivery</h2>
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              location.pathname === item.path
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-blue-100"
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default DeliverySidebar;
