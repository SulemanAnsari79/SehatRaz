import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getDeliveryLocations } from "../../services/LocationService";
import { 
  Target01Icon, 
  ViewIcon, 
  CheckmarkBadge01Icon, 
  GlobalIcon, 
  Location01Icon, 
  City01Icon, 
  Mail01Icon,
  StethoscopeIcon,
  CleanIcon
} from 'hugeicons-react';

const About = () => {
  const [locations, setLocations] = useState({
    isEnabled: false,
    cities: [],
    states: [],
    countries: [],
    pincodes: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      const data = await getDeliveryLocations();
      if (data.success && data.locations) {
        setLocations(data.locations);
      }
      setLoading(false);
    };
    fetchLocations();
  }, []);

  return (
    <div className="bg-[#fafbfc] min-h-screen font-['Plus_Jakarta_Sans']">
      <Navbar />

      <main className="pt-12">
        {/* 1. PREMIUM HERO SECTION */}
        <section className="relative py-24 px-6 overflow-hidden">
          <div className="absolute inset-0 z-0">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-linear-to-b from-blue-50/50 to-transparent"></div>
          </div>
          
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-8 shadow-sm border border-slate-100">
               <StethoscopeIcon size={16} className="text-[#1A56DB]" variant="bulk" />
               <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Our Journey</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 leading-tight">
              India’s Most Trusted <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#1A56DB] to-[#0D9488] italic font-serif">Healthcare Ecosystem.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
              Sehatraz is redefining how you access wellness, merging cutting-edge pharmacy logistics with expert medical consultations.
            </p>
          </div>
        </section>

        {/* 2. OVERLAP CONTENT SECTION */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-teal-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10 p-4 bg-white rounded-[3rem] shadow-2xl border border-slate-50 -rotate-2">
                <img
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800"
                  alt="Our Team"
                  className="rounded-[2.5rem] w-full h-125 object-cover"
                />
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Who We Are</h2>
              <div className="space-y-6 text-slate-600 font-medium leading-relaxed text-lg">
                <p>
                  Sehatraz is an integrated e-commerce and e-healthcare platform designed to make healthcare <span className="text-slate-900 font-bold">accessible, affordable, and convenient</span>.
                </p>
                <p>
                  We bridge the gap between quality medical products and professional online consultations, empowering you to take complete control of your health journey under one digital roof.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                 <div className="bg-white p-6 rounded-3xl border border-slate-100">
                    <p className="text-3xl font-black text-[#1A56DB]">10k+</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Users Served</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-100">
                    <p className="text-3xl font-black text-[#0D9488]">50+</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Expert Doctors</p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CORE PILLARS (Mission/Vision/Values) */}
        <section className="bg-slate-900 py-32">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
            {[
              { icon: <Target01Icon />, title: "Mission", text: "Providing easy access to reliable healthcare and consultations for every citizen.", color: "text-blue-400" },
              { icon: <ViewIcon />, title: "Vision", text: "Becoming India’s most trusted and technologically advanced health partner.", color: "text-teal-400" },
              { icon: <CleanIcon />, title: "Values", text: "Unwavering Trust, Transparency, and a Customer-First Clinical mindset.", color: "text-rose-400" }
            ].map((pillar, i) => (
              <div key={i} className="group p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all">
                <div className={`${pillar.color} mb-6 transform group-hover:scale-110 transition-transform`}>
                   {React.cloneElement(pillar.icon, { size: 40, variant: "bulk" })}
                </div>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{pillar.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed">{pillar.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. WHY CHOOSE US - BENTO GRID */}
        <section className="py-32 max-w-7xl mx-auto px-6">
          <h2 className="text-center text-4xl font-black text-slate-900 mb-16 tracking-tighter">The Sehatraz Advantage</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Genuine Products', 'Expert Consultation', 'Secure Payments', 'Fast Delivery'].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-4xl border border-slate-100 flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="p-3 bg-blue-50 text-[#1A56DB] rounded-2xl">
                   <CheckmarkBadge01Icon size={24} variant="bulk" />
                </div>
                <span className="font-black text-slate-800 tracking-tight">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. DELIVERY LOCATIONS - GLASSMORPHISM */}
        {locations.isEnabled && (
          <section className="bg-white py-32 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-[#fafbfc] rounded-[4rem] p-12 md:p-20 border border-slate-100">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 text-center mb-16 tracking-tighter">
                  Currently <span className="text-[#1A56DB]">Deliver</span> In:
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 ">
                  {[
                    { title: "Countries", list: locations.countries, icon: <GlobalIcon />, color: "bg-indigo-600" },
                    { title: "States", list: locations.states, icon: <Location01Icon />, color: "bg-blue-600" },
                    { title: "Cities", list: locations.cities, icon: <City01Icon />, color: "bg-cyan-600" },
                  ].map((loc, i) => (
                    loc.list && loc.list.length > 0 && (
                      <div key={i} className="bg-white p-8 rounded-4xl shadow-sm border border-slate-50 flex flex-col items-center">
                        <div className={`w-12 h-12 ${loc.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                          {React.cloneElement(loc.icon, { size: 24, variant: "bulk" })}
                        </div>
                        <h3 className="font-black text-slate-900 mb-4 uppercase text-[11px] tracking-[0.2em]">{loc.title}</h3>
                        <div className="w-full space-y-2">
                           {loc.list.map((item, idx) => (
                             <div key={idx} className="bg-slate-50 p-3 rounded-xl text-center text-sm font-bold text-slate-600 border border-slate-100">
                               {item}
                             </div>
                           ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default About;