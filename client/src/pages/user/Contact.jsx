import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/Api.js";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { 
  Mail01Icon, 
  // Phone01Icon, 
  Location01Icon, 
  SentIcon,
  Chat01Icon,
  CustomerService01Icon, 
  TelephoneIcon
} from 'hugeicons-react';

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSending(true);
      const response = await api.post("/user/contact-us", {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      if (response?.data?.success) {
        toast.success("Message sent successfully");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        toast.error(response?.data?.message || "Failed to send message");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#fafbfc] min-h-screen font-['Plus_Jakarta_Sans']">
      <Navbar />

      <main className="pt-12 md:pt-20">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6 border border-blue-100">
            <CustomerService01Icon size={16} className="text-[#1A56DB]" variant="bulk" />
            <span className="text-[11px] font-black text-[#1A56DB] uppercase tracking-wider">Support Center</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6">
            We’re here to <span className="italic font-serif text-[#0D9488]">Help.</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Whether you have a question about medications, consultations, or delivery, our team is ready to assist you.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-24 grid lg:grid-cols-12 gap-12">
          
          {/* Left Side: Interaction Terminal */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
              <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <Chat01Icon size={28} className="text-[#1A56DB]" variant="bulk" />
                Drop a Message
              </h2>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-4">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-[#1A56DB]/20 font-bold text-slate-800 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-4">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="xyz@example.com"
                      className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-[#1A56DB]/20 font-bold text-slate-800 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-4">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-[#1A56DB]/20 font-bold text-slate-800 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-4">Message</label>
                  <textarea
                    rows="5"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your inquiry..."
                    className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-[#1A56DB]/20 font-bold text-slate-800 transition-all outline-none resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full group relative overflow-hidden bg-slate-900 text-white py-5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all hover:bg-[#1A56DB] disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {sending ? "Transmitting..." : "Send Message"}
                    <SentIcon size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Side: Contact Info & Map */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Contact Info Cards */}
            <div className="grid gap-4">
              {[
                { icon: <Location01Icon />, title: "Headquarters", detail: "New Delhi, India", color: "text-blue-600", bg: "bg-blue-50" },
                { icon: <TelephoneIcon />, title: "Support Line", detail: "+91 98765 43210", color: "text-teal-600", bg: "bg-teal-50" },
                { icon: <Mail01Icon />, title: "Direct Email", detail: "sehatraz@gmail.com", color: "text-rose-600", bg: "bg-rose-50" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-6 bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`p-4 ${item.bg} ${item.color} rounded-2xl`}>
                    {React.cloneElement(item.icon, { size: 24, variant: "bulk" })}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{item.title}</h4>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Premium Map Widget */}
            <div className="relative group overflow-hidden bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
              <iframe
                title="map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224345.8392319277!2d77.06889754725782!3d28.52721314304836!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b347ec52d%3A0x52c01abc0e75a643!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
                className="w-full h-72 rounded-4xl grayscale contrast-125 opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                loading="lazy"
              ></iframe>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;