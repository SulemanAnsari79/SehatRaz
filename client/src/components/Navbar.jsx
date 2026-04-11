// components/Navbar.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ShoppingBasket01Icon, 
  UserCircleIcon, 
  Menu01Icon, 
  Cancel01Icon, 
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

  // Close menu when clicking a link
  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { name: 'Products', path: '/products' },
    { name: 'Doctors', path: '/doctors' },
    { name: 'Contact', path: '/contact' },
    { name: 'About', path: '/about' }
  ];

  return (
    <header className="sticky top-0 w-full z-50 font-['Plus_Jakarta_Sans'] transition-all duration-500 px-4">
      
      {/* 1. THE MINI TICKER */}
      <div className={`max-w-7xl mx-auto mb-2 transition-all duration-500 ${scrolled ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-6 mt-2'}`}>
        <div className="bg-slate-900 rounded-full py-1 px-4 border border-slate-800">
          <div className="flex justify-center items-center text-[10px] font-black text-white uppercase tracking-[0.2em]">
             Licensed Pharmacy Delhi • Express Delivery UP
          </div>
        </div>
      </div>

      {/* 2. THE FLOATING ISLAND */}
      <nav className={`max-w-7xl mx-auto transition-all duration-500 ease-in-out
        ${scrolled 
          ? 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg rounded-[2rem] py-3' 
          : 'bg-white border-slate-100 shadow-sm rounded-[1.5rem] py-5'
        } border`}>
        
        <div className="flex justify-between items-center px-6">
          
          {/* Mobile Menu Toggle (Left on Mobile) */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl"
          >
            {isOpen ? <Cancel01Icon size={24} /> : <Menu01Icon size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
            <div className="p-2 bg-slate-900 rounded-xl shadow-lg shadow-blue-900/20">
              <StethoscopeIcon size={20} color="#fff" variant="bulk" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">
              Sehat<span className="text-[#1A56DB]">raz</span>
            </span>
          </Link>

          {/* Desktop Links (Hidden on Phone) */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((item) => (
              <Link key={item.name} to={item.path} className="text-[13px] font-black text-slate-600 hover:text-[#1A56DB] transition-colors">
                {item.name}
              </Link>
            ))}
          </div>

          {/* Icons (Right) */}
          <div className="flex items-center gap-1 sm:gap-3">
            <Link to="/cart" className="relative p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-all">
                <ShoppingBasket01Icon size={22} variant="bulk" />
                <span className="absolute top-1 right-1 bg-[#E11D48] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {getCartCount()}
                </span>
            </Link>
            <Link to="/profile" className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-all">
                <UserCircleIcon size={22} variant="bulk" />
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. MOBILE OVERLAY MENU */}
      <div className={`lg:hidden fixed inset-0 top-[100px] z-[-1] transition-all duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Blurred Backdrop */}
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md" onClick={closeMenu}></div>
        
        {/* Menu Content */}
        <div className={`absolute left-4 right-4 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-2xl transition-all duration-500 transform ${isOpen ? 'translate-y-0' : '-translate-y-10'}`}>
          <div className="flex flex-col gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Navigation</p>
            {navLinks.map((item) => (
              <Link 
                key={item.name} 
                to={item.path} 
                onClick={closeMenu}
                className="text-2xl font-black text-slate-900 flex justify-between items-center group"
              >
                {item.name}
                <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-[#1A56DB] group-hover:text-white transition-all">
                   →
                </div>
              </Link>
            ))}
            
            <div className="mt-6 pt-6 border-t border-slate-50">
                <Link to="/ai-consult" onClick={closeMenu} className="w-full bg-slate-900 text-white text-center py-4 rounded-2xl font-black text-sm uppercase tracking-widest block">
                    Ask Sehatraz AI
                </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;