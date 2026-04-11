import React from "react";
import { Link } from "react-router-dom";
import { 
  SparklesIcon, 
  AiMagicIcon, 
  ArrowRight01Icon, 
  Tick02Icon,
  Search01Icon
} from "hugeicons-react";

const Question = () => {
  return (
    <section className="bg-white py-24 px-6 font-['Plus_Jakarta_Sans'] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-slate-50 rounded-[3.5rem] p-8 md:p-20 border border-slate-100 overflow-hidden">
          
          {/* Background Decoration */}
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-[#0D9488]/5 rounded-full blur-[100px]"></div>

          <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
            
            {/* LEFT SIDE: THE CUSTOM SVG DASHBOARD */}
            <div className="relative flex justify-center items-center">
              <svg 
                viewBox="0 0 500 400" 
                className="w-full h-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.05)] transition-transform duration-700 hover:scale-105"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Main Dashboard Card */}
                <rect x="50" y="50" width="400" height="300" rx="40" fill="white" />
                <rect x="50" y="50" width="400" height="300" rx="40" stroke="#f1f5f9" strokeWidth="2" />
                
                {/* Header Section of SVG */}
                <rect x="90" y="90" width="120" height="12" rx="6" fill="#e2e8f0" />
                <circle cx="400" cy="100" r="15" fill="#1A56DB" fillOpacity="0.1" />
                
                {/* Simulated Questionnaire Lines */}
                <rect x="90" y="140" width="320" height="60" rx="20" fill="#f8fafc" />
                <rect x="120" y="160" width="200" height="8" rx="4" fill="#cbd5e1" />
                <circle cx="380" cy="170" r="10" fill="#0D9488" />

                <rect x="90" y="215" width="320" height="60" rx="20" fill="#f8fafc" />
                <rect x="120" y="235" width="150" height="8" rx="4" fill="#cbd5e1" />
                <circle cx="380" cy="245" r="10" fill="#cbd5e1" />

                {/* Floating "Recommendation" Result Card */}
                <g className="animate-float">
                    <rect x="250" y="180" width="220" height="120" rx="30" fill="white" filter="url(#shadow)" />
                    <rect x="250" y="180" width="220" height="120" rx="30" stroke="#1A56DB" strokeWidth="2" strokeDasharray="6 6" />
                    
                    {/* Tiny Health Icon in Result Card */}
                    <circle cx="295" cy="225" r="20" fill="#1A56DB" />
                    <rect x="330" y="215" width="80" height="8" rx="4" fill="#1A56DB" />
                    <rect x="330" y="230" width="50" height="6" rx="3" fill="#94a3b8" />
                    
                    <rect x="280" y="265" width="160" height="20" rx="10" fill="#1A56DB" />
                </g>

                <defs>
                  <filter id="shadow" x="0" y="0" width="500" height="500" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="20" stdDeviation="20" floodColor="#1A56DB" floodOpacity="0.15" />
                  </filter>
                </defs>
              </svg>

              {/* Real Icon Overlay for Sharpness */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 lg:opacity-100">
                <div className="bg-white p-6 rounded-full shadow-2xl border border-slate-100 animate-pulse">
                   <AiMagicIcon size={40} className="text-[#1A56DB]" variant="bulk" />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: THE TEXT CONTENT */}
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-slate-900 leading-[0.95] tracking-tighter">
                  Perfect Products. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A56DB] to-[#0D9488] italic font-serif">Tailored for you.</span>
                </h2>
                <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md">
                  Stop guessing. Our algorithm analyzes your unique needs to match you with verified healthcare solutions.
                </p>
              </div>

              {/* Feature Points */}
              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: <Tick02Icon size={18}/>, text: "Clinical Study Backed Recommendations" },
                  { icon: <Tick02Icon size={18}/>, text: "Upload Symptoms for Accurate Matching" },
                  { icon: <Tick02Icon size={18}/>, text: "Saves up to 40% on unnecessary supplements" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className="p-1.5 bg-[#0D9488]/10 rounded-lg text-[#0D9488] group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-[15px] font-bold text-slate-700 tracking-tight">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link to="/recommended" className="inline-block group relative">
                    {/* Button Shadow */}
                    <div className="absolute inset-0 bg-[#1A56DB] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    
                    <button className="relative flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm tracking-widest uppercase transition-all duration-300 hover:bg-[#1A56DB] hover:-translate-y-1 active:scale-95">
                        Start Health Quiz
                        <ArrowRight01Icon size={20} />
                    </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Question;