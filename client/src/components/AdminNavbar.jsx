// import { useState } from "react";
import { Link } from "react-router-dom";
// import { FiMenu, FiX } from "react-icons/fi"; // Hamburger & Close icons

const AdminNavbar = () => {
  // const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo / Title */}
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link to={'/login'} className="text-red-500 font-medium hover:text-red-600 transition">
            Logout
          </Link>
        </div>

        {/* Mobile Menu Button */}
        {/* <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div> */}
      </div>

      {/* Mobile Menu */}
      {/* {isOpen && ( */}
        <div className="md:hidden mt-2 space-y-2">
          <button className="block w-full text-left text-red-500 font-medium hover:text-red-600 transition">
            Logout
          </button>
        </div>
      {/* )} */}
    </nav>
  );
};

export default AdminNavbar;
