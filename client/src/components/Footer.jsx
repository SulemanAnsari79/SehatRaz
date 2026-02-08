import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-600 text-gray-300 px-6 py-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

        {/* Column 1 - Logo */}
        <div>
          <img 
            src="/logo.png" 
            alt="Sehatraz Logo" 
            className="w-40 mb-3"
          />
          <p className="text-sm">
            Your trusted healthcare & wellness partner.
          </p>
        </div>

        {/* Column 2 - Description */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-3">
            About Sehatraz
          </h3>
          <p className="text-sm leading-relaxed">
            Sehatraz is an integrated e-commerce and e-healthcare platform 
            that helps users purchase healthcare products and consult doctors online.
          </p>
        </div>

        {/* Column 3 - Quick Links */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-3">
            Quick Links
          </h3>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="hover:text-green-400">Home</Link>
            </li>
            <li>
              <Link to="/products" className="hover:text-green-400">Products</Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-green-400">About</Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-green-400">Contact</Link>
            </li>
          </ul>
        </div>

        {/* Column 4 - Contact Info */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-3">
            Contact Us
          </h3>
          <p className="text-sm">📧 sehatraz@gmail.com</p>
          <p className="text-sm mt-2">📞 +91 98765 43210</p>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="text-center text-sm text-gray-400 mt-8 border-t border-gray-700 pt-4">
        © {new Date().getFullYear()} Sehatraz. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;

