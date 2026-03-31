import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiTruck } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";

const DeliveryNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md px-6 py-4">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <FiTruck size={20} />
          <span>Delivery Panel</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm hidden sm:block">
            Welcome, <strong>{user?.name}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm"
          >
            <FiLogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default DeliveryNavbar;
