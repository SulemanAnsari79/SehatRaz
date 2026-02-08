import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const About = () => {
  return (
    <>
    <Navbar />
    <div className="bg-gray-50 min-h-screen">

      {/* Hero Section */}
      <div className="bg-green-500 text-white py-20 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          About Sehatraz
        </h1>
        <p className="max-w-2xl mx-auto text-lg">
          Your Trusted Digital Healthcare & Wellness Marketplace
        </p>
      </div>

      {/* About Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">

        {/* Text */}
        <div>
          <h2 className="text-3xl font-bold mb-4">
            Who We Are
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Sehatraz is an integrated e-commerce and e-healthcare platform
            designed to make healthcare accessible, affordable, and convenient.
            We bring together quality medical products and professional online
            doctor consultations under one digital roof.
          </p>

          <p className="text-gray-600 mt-4 leading-relaxed">
            Our goal is to empower people to take control of their health by
            offering trusted products, expert guidance, and seamless digital
            experiences.
          </p>
        </div>

        {/* Image */}
        <div>
          <img
            src="/about.jpg"
            alt="About Sehatraz"
            className="rounded-xl shadow-lg w-full"
          />
        </div>

      </div>

      {/* Mission / Vision / Values */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">

          {/* Mission */}
          <div className="bg-gray-50 p-6 rounded-xl shadow hover:shadow-md transition">
            <h3 className="text-xl font-semibold mb-3 text-green-600">
              Our Mission
            </h3>
            <p className="text-gray-600">
              To provide easy access to reliable healthcare products and
              professional medical consultations for everyone.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-gray-50 p-6 rounded-xl shadow hover:shadow-md transition">
            <h3 className="text-xl font-semibold mb-3 text-green-600">
              Our Vision
            </h3>
            <p className="text-gray-600">
              To become India’s most trusted digital healthcare ecosystem.
            </p>
          </div>

          {/* Values */}
          <div className="bg-gray-50 p-6 rounded-xl shadow hover:shadow-md transition">
            <h3 className="text-xl font-semibold mb-3 text-green-600">
              Our Values
            </h3>
            <p className="text-gray-600">
              Trust, Transparency, Quality, and Customer First.
            </p>
          </div>

        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-3xl font-bold text-center mb-10">
            Why Choose Sehatraz?
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">

            <div className="bg-white p-5 rounded-lg shadow text-center">
              ✔ Genuine Products
            </div>

            <div className="bg-white p-5 rounded-lg shadow text-center">
              ✔ Online Doctor Consultation
            </div>

            <div className="bg-white p-5 rounded-lg shadow text-center">
              ✔ Secure Payments
            </div>

            <div className="bg-white p-5 rounded-lg shadow text-center">
              ✔ Fast Delivery
            </div>

          </div>

        </div>
      </div>

    </div>
    <Footer />
    </>
    
  );
};

export default About;
