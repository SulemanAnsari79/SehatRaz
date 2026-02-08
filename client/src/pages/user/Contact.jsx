import React from "react";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";

const Contact = () => {
  return (
  <>
    <Navbar />
       <div className="bg-gray-50 min-h-screen">

      {/* Hero Section */}
      <div className="bg-green-500 text-white py-16 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          Contact Us
        </h1>
        <p className="text-lg">
          We'd love to hear from you
        </p>
      </div>

      {/* Main Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-xl shadow">

          <h2 className="text-2xl font-semibold mb-6">
            Send a Message
          </h2>

          <form className="space-y-4">

            <input
              type="text"
              placeholder="Your Name"
              className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <input
              type="email"
              placeholder="Your Email"
              className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <input
              type="text"
              placeholder="Subject"
              className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <textarea
              rows="4"
              placeholder="Your Message"
              className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            ></textarea>

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-3 rounded hover:bg-green-600 transition"
            >
              Send Message
            </button>

          </form>

        </div>

        {/* Contact Info */}
        <div className="space-y-6">

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold text-lg mb-2">📍 Address</h3>
            <p className="text-gray-600">
              New Delhi, India
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold text-lg mb-2">📞 Phone</h3>
            <p className="text-gray-600">
              +91 98765 43210
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold text-lg mb-2">📧 Email</h3>
            <p className="text-gray-600">
              sehatraz@gmail.com
            </p>
          </div>

          {/* Map */}
          <div className="bg-white p-3 rounded-xl shadow">
            <iframe
              title="map"
              src="https://www.google.com/maps?q=India&output=embed"
              className="w-full h-56 rounded"
              loading="lazy"
            ></iframe>
          </div>

        </div>

      </div>

    </div>
    <Footer />
  </>
  );
};

export default Contact;
