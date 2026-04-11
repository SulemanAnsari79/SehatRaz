// components/Navbar.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ShoppingBasket01Icon, 
  UserCircleIcon, 
  Menu01Icon, 
  Cancel01Icon, 
  AiChat02Icon, 
  StethoscopeIcon 
} from 'hugeicons-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { getCartCount } = useContext(AuthContext);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    /* Change 'fixed' to 'sticky' and ensure it's at the very top */
    <header className="sticky top-0 w-full z-50 font-['Plus_Jakarta_Sans'] transition-all duration-500">
      
      {/* 1. THE MINI TICKER */}
      <div className={`max-w-7xl mx-auto mb-2 transition-all duration-500 ${scrolled ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-6 mt-2'}`}>
        <div className="bg-slate-900 rounded-full py-1 px-4 border border-slate-800">
          <div className="flex justify-center items-center text-[10px] font-black text-white uppercase tracking-[0.2em]">
             Licensed Pharmacy Delhi • Express Delivery UP
          </div>
        </div>
      </div>

      {/* 2. THE FLOATING ISLAND */}
      <nav className={`max-w-7xl mx-auto transition-all duration-500 ease-in-out px-4
        ${scrolled 
          ? 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg rounded-4xl py-3' 
          : 'bg-white border-slate-100 shadow-sm rounded-4xl py-5'
        } border`}>
        
        <div className="flex justify-between items-center px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl">
              <StethoscopeIcon size={20} color="#fff" variant="bulk" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">
              Sehat<span className="text-[#1A56DB]">raz</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {['Products', 'Doctors', 'Contact', 'About'].map((item) => (
              <Link key={item} to={`/${item.toLowerCase()}`} className="text-[13px] font-black text-slate-600 hover:text-[#1A56DB]">
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative p-2 text-slate-700">
                <ShoppingBasket01Icon size={22} variant="bulk" />
                <span className="absolute top-0 right-0 bg-[#E11D48] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {getCartCount()}
                </span>
            </Link>
            <Link to="/profile" className="p-2 text-slate-700">
                <UserCircleIcon size={22} variant="bulk" />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;