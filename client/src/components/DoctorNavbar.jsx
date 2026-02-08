import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX, FiUser } from "react-icons/fi";

const DoctorNavbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md px-6 py-4">
      <div className="flex justify-end items-center max-w-7xl mx-auto">

        {/* Logo / Title
        <h1 className="text-xl font-semibold text-blue-600">
          Doctor Panel
        </h1> */}

        {/* Desktop Menu */}
          <div className="flex  gap-3">
            <Link to="/doctor/profile" className="hover:text-blue-500"> <FiUser className="size-8" /></Link>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
            Logout
          </button>
          </div>
          

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden mt-4 space-y-3 px-4">

          <Link to="/doctor" className="block">Dashboard</Link>
          <Link to="/doctor/appointments" className="block">Appointments</Link>
          <Link to="/doctor/patients" className="block">Patients</Link>
          <Link to="/doctor/profile" className="flex items-center gap-2">
            <FiUser /> Profile
          </Link>

          <button className="w-full bg-red-500 text-white py-2 rounded-lg">
            Logout
          </button>

        </div>
      )}
    </nav>
  );
};

export default DoctorNavbar;

