import React from "react";
import { 
  Search01Icon, 
  OrganicFoodIcon, 
  SecurityCheckIcon, 
  DeliveryTruck01Icon, 
  CustomerService01Icon,
  Medicine01Icon,
  Doctor01Icon 
} from 'hugeicons-react';

const Hero = () => {
  return (
    <section className="relative bg-[#fafbfc] pt-20 pb-32 font-['Plus_Jakarta_Sans'] px-6 overflow-hidden">
      
      {/* 1. LAYERED IMMERSIVE BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Animated Aurora Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-[140px] animate-mesh-1"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-gradient-to-tr from-teal-400/20 to-transparent rounded-full blur-[140px] animate-mesh-2"></div>
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-gradient-to-l from-indigo-400/10 to-transparent rounded-full blur-[120px] animate-mesh-3"></div>

        {/* Grainy Noise Texture Overlay (The Secret to "Premium" Look) */}
        <div className="absolute inset-0 opacity-[0.4] mix-blend-overlay" 
             style={{ backgroundImage: `url("https://res.cloudinary.com/dzf9rq999/image/upload/v1689150383/noise_vv6yzk.png")` }}>
        </div>

        {/* Subtle Geometric Grid */}
        <div className="absolute inset-0 opacity-[0.05]" 
             style={{ backgroundImage: `radial-gradient(#1A56DB 0.5px, transparent 0.5px)`, backgroundSize: '30px 30px' }}>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* 2. FLOATING ELEMENTS WITH BLUR GLASS EFFECTS */}
        <div className="absolute top-0 left-0 hidden lg:block animate-float">
           <div className="backdrop-blur-xl bg-white/40 p-4 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/20 flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                <Medicine01Icon size={20} color="#fff" variant="bulk" />
              </div>
              <span className="text-[11px] font-black uppercase text-slate-600 tracking-tighter">Certified Meds</span>
           </div>
        </div>

        <div className="absolute bottom-130 right-0 hidden lg:block animate-float-delayed">
           <div className="backdrop-blur-xl bg-white/40 p-4 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/20 flex items-center gap-3">
              <div className="p-2 bg-teal-500 rounded-xl shadow-lg shadow-teal-200">
                <Doctor01Icon size={20} color="#fff" variant="bulk" />
              </div>
              <span className="text-[11px] font-black uppercase text-slate-600 tracking-tighter">Live Consult</span>
           </div>
        </div>

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-md px-6 py-2.5 rounded-full mb-8 border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em]">India's #1 Digital Healthcare</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9] overflow-visible">
            Your Health, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A56DB] via-[#2563EB] to-[#0D9488] italic font-serif">
               Simplified.
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-12 opacity-80">
            Order genuine medications and consult specialists. 
          </p>

          {/* 3. ULTRA-MODERN SEARCH BOX */}
          {/* <div className="max-w-3xl mx-auto px-4 relative group">
            <div className="absolute inset-0 bg-blue-600/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative flex flex-col md:flex-row items-center bg-white border-[1px] border-slate-200 rounded-[2.5rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500 focus-within:border-blue-500 focus-within:shadow-[0_20px_50px_rgba(26,86,219,0.1)]">
              <div className="flex-1 flex items-center px-6 py-4 w-full">
                <Search01Icon size={24} className="text-blue-600" />
                <input 
                  type="text" 
                  placeholder="What are you feeling today?" 
                  className="w-full bg-transparent px-5 outline-none font-bold text-lg text-slate-800 placeholder:text-slate-300"
                />
              </div>
              <button className="w-full md:w-auto bg-[#1A56DB] text-white px-12 py-5 rounded-[2rem] font-black text-sm tracking-widest uppercase hover:bg-slate-900 transition-all shadow-lg shadow-blue-200 hover:shadow-none">
                Get Solution
              </button>
            </div>
          </div> */}
        </div>

        {/* 4. PREMIUM MINI BENTO GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {[
            { icon: <SecurityCheckIcon variant="bulk" />, title: "Certified", color: "from-blue-600 to-blue-400" },
            { icon: <OrganicFoodIcon variant="bulk" />, title: "Natural", color: "from-teal-600 to-teal-400" },
            { icon: <DeliveryTruck01Icon variant="bulk" />, title: "Swift", color: "from-rose-600 to-rose-400" },
            { icon: <CustomerService01Icon variant="bulk" />, title: "Support", color: "from-amber-600 to-amber-400" }
          ].map((item, i) => (
            <div key={i} className="group relative bg-white/60 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {React.cloneElement(item.icon, { size: 80 })}
              </div>
              <div className={`mb-5 inline-block p-3 rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg transform group-hover:rotate-12 transition-transform`}>
                {React.cloneElement(item.icon, { size: 28 })}
              </div>
              <h4 className="font-black text-slate-900 text-lg tracking-tight">{item.title}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Care</p>
            </div>
          ))}
        </div>
      </div>

      {/* <style jsx>{`
        @keyframes mesh-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10%, 15%) scale(1.1); }
        }
        @keyframes mesh-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15%, -10%) scale(1.2); }
        }
        @keyframes mesh-3 {
          0%, 100% { transform: translate(0, 0) scale(1.1); }
          50% { transform: translate(10%, -10%) scale(1); }
        }
        .animate-mesh-1 { animation: mesh-1 15s infinite alternate ease-in-out; }
        .animate-mesh-2 { animation: mesh-2 18s infinite alternate-reverse ease-in-out; }
        .animate-mesh-3 { animation: mesh-3 20s infinite alternate ease-in-out; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-20px) rotate(-2deg); }
        }
        .animate-float { animation: float 7s ease-in-out infinite; }
        .animate-float-delayed { animation: float 9s ease-in-out infinite; animation-delay: 2s; }
      `}</style> */}
    </section>
  );
};

export default Hero;