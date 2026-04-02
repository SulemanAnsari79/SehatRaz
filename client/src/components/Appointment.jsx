import React from "react";
import { Link } from "react-router-dom";

const Appointment = () => {
  return (
    <div className="bg-gray-50 py-16 px-6">

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">

        {/* Left Side - Image */}
        <div>
          <h2 className="text-3xl font-bold mb-4">
            Consult a Doctor Online
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Book an online appointment with experienced doctors and get
            professional medical advice from the comfort of your home.
            Choose your specialist, select a time slot, and start consultation
            easily.
          </p>

          <Link to="/doctors">
            <button className="bg-green-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-600 transition">
              Book Appointment
            </button>
          </Link>
        </div>
        
        
        {/* Right Side - Content */}
        <div>
          <img
            src="https://via.placeholder.com/600x400?text=Book+Appointment"
            alt="Book Doctor Appointment"
            className="w-full rounded-xl shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default Appointment;
