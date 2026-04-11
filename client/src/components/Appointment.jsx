import React from "react";
import { Link } from "react-router-dom";
import { 
  SparklesIcon, 
  ArrowRight01Icon, 
  Tick02Icon,
  AiMagicIcon,
  UserIcon
} from "hugeicons-react";

const ServicesGrid = () => {
  return (
    <div className="bg-white font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        
        {/* 1. SMART WELLNESS GUIDE SECTION */}
        <section className="relative bg-[#EEF2FF] rounded-[3.5rem] p-8 md:p-16 border border-blue-100 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
            {/* SVG Visual Side */}
            <div className="relative flex justify-center items-center">
              <svg viewBox="0 0 500 400" className="w-full h-auto drop-shadow-2xl animate-float" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="50" y="50" width="400" height="300" rx="40" fill="white" />
                <rect x="80" y="100" width="200" height="12" rx="6" fill="#1A56DB" fillOpacity="0.1" />
                {/* AI Bubbles */}
                <circle cx="100" cy="160" r="30" fill="#1A56DB" fillOpacity="0.05" />
                <rect x="150" y="150" width="220" height="10" rx="5" fill="#EEF2FF" />
                <rect x="150" y="175" width="160" height="10" rx="5" fill="#EEF2FF" />
                {/* Recommendation Pill */}
                <rect x="80" y="240" width="340" height="80" rx="24" fill="#1A56DB" />
                <circle cx="125" cy="280" r="20" fill="white" fillOpacity="0.2" />
                <rect x="165" y="270" width="180" height="8" rx="4" fill="white" />
                <rect x="165" y="285" width="100" height="6" rx="3" fill="white" fillOpacity="0.6" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-white p-5 rounded-full shadow-2xl border border-blue-50">
                  <AiMagicIcon size={40} className="text-[#1A56DB]" variant="bulk" />
                </div>
              </div>
            </div>

            {/* Content Side */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-100/50 px-4 py-2 rounded-full border border-blue-200/50">
                <SparklesIcon size={16} className="text-[#1A56DB]" variant="bulk" />
                <span className="text-[11px] font-black text-[#1A56DB] uppercase tracking-wider">AI Powered Analysis</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                Smart Wellness <br />
                <span className="italic font-serif text-[#1A56DB]">Guide.</span>
              </h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                Confused about supplements? Our AI analyzes your lifestyle to recommend the perfect wellness routine.
              </p>
              <Link to="/recommended" className="inline-block group relative pt-4">
                <div className="absolute inset-0 bg-[#1A56DB] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <button className="relative flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm tracking-widest uppercase transition-all hover:bg-[#1A56DB] hover:-translate-y-1">
                  Get Started <ArrowRight01Icon size={20} />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* 2. TELE-CONSULTATION SECTION */}
        <section className="relative bg-[#F0FDFA] rounded-[3.5rem] p-8 md:p-16 border border-teal-100 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
            {/* Content Side (Flipped for Layout Variety) */}
            <div className="space-y-6 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-teal-100/50 px-4 py-2 rounded-full border border-teal-200/50">
                {/* <VideoReorderIcon size={16} className="text-[#0D9488]" variant="bulk" /> */}
                <span className="text-[11px] font-black text-[#0D9488] uppercase tracking-wider">24/7 Verified Doctors</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                Expert Tele- <br />
                <span className="italic font-serif text-[#0D9488]">Consultation.</span>
              </h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                Connect with specialists in Delhi & UP within minutes via high-quality secure video calls.
              </p>
              <Link to="/doctors" className="inline-block group relative pt-4">
                <div className="absolute inset-0 bg-[#0D9488] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <button className="relative flex items-center gap-4 bg-[#0D9488] text-white px-10 py-5 rounded-[2rem] font-black text-sm tracking-widest uppercase transition-all hover:bg-slate-900 hover:-translate-y-1">
                  Book Appointment <ArrowRight01Icon size={20} />
                </button>
              </Link>
            </div>

            {/* SVG Visual Side */}
            <div className="relative flex justify-center items-center order-1 lg:order-2">
              <svg viewBox="0 0 500 400" className="w-full h-auto drop-shadow-2xl animate-float-delayed" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="50" y="50" width="400" height="300" rx="40" fill="white" />
                {/* Video Call Interface */}
                <rect x="75" y="75" width="350" height="200" rx="20" fill="#F0FDFA" />
                <circle cx="250" cy="150" r="40" fill="#0D9488" fillOpacity="0.1" />
                <path d="M230 150L245 165L275 135" stroke="#0D9488" strokeWidth="8" strokeLinecap="round" />
                {/* Controls */}
                <circle cx="210" cy="310" r="20" fill="#0D9488" />
                <circle cx="250" cy="310" r="20" fill="#E11D48" />
                <circle cx="290" cy="310" r="20" fill="#cbd5e1" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-white p-5 rounded-full shadow-2xl border border-teal-50 animate-pulse">
                  <UserIcon size={40} className="text-[#0D9488]" variant="bulk" />
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
      
      {/* Required Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 6s ease-in-out infinite; animation-delay: 3s; }
      `}</style>
    </div>
  );
};

export default ServicesGrid;