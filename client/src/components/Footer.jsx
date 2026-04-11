import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-gray-800 pb-12">
        {/* Brand */}
        <div className="col-span-1 md:col-span-1">
          <span className="text-2xl font-bold text-white">Sehat<span className="text-[#1A56DB]">raz</span></span>
          <p className="mt-4 text-sm leading-relaxed">
            India’s growing digital healthcare ecosystem. Bringing quality healthcare products and expert advice to every doorstep.
          </p>
          <div className="flex space-x-4 mt-6">
            <Instagram size={20} className="hover:text-white cursor-pointer" />
            <Facebook size={20} className="hover:text-white cursor-pointer" />
            <Twitter size={20} className="hover:text-white cursor-pointer" />
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Platform</h3>
          <ul className="space-y-4 text-sm">
            <li><Link to="/products" className="hover:text-white">Medicines</Link></li>
            <li><Link to="/doctors" className="hover:text-white">Online Consultation</Link></li>
            <li><Link to="/contact" className="hover:text-white">Wellness Products</Link></li>
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
          </ul>
        </div>

        {/* Service Areas */}
        <div>
          <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Delivering To</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center"><MapPin size={14} className="mr-2" /> Delhi (110025)</li>
            <li className="flex items-center"><MapPin size={14} className="mr-2" /> Uttar Pradesh (Shahjahanpur)</li>
            <li className="text-[10px] text-gray-500 mt-2 italic">*More locations coming soon</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Get in Touch</h3>
          <div className="space-y-4 text-sm">
            <p className="flex items-center"><Mail size={14} className="mr-2" /> sehatraz@gmail.com</p>
            <p className="flex items-center"><Phone size={14} className="mr-2" /> +91 98765 43210</p>
          </div>
        </div>
      </div>
      
      <p className="text-center mt-8 text-[12px]">
        © 2026 Sehatraz Healthcare. Secure Payments Powered by SSL.
      </p>
    </footer>
  );
};

export default Footer;