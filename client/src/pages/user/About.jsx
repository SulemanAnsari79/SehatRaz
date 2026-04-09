import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getDeliveryLocations } from "../../services/LocationService";

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
    <>
    <Navbar />
    <div className="bg-gray-50 min-h-screen">

      {/* Hero Section */}

      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-20 text-center px-4">
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

      {/* Delivery Locations */}
      {locations.isEnabled && (locations.cities.length > 0 || locations.states.length > 0 || locations.countries.length > 0 || locations.pincodes.length > 0) && (
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-10">
              Currently Delivering To
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Countries */}
              {locations.countries && locations.countries.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-indigo-800 flex items-center">
                    <span className="text-xl">🌍</span> <span className="ml-2">Countries</span>
                  </h3>
                  <ul className="space-y-2">
                    {locations.countries.map((country, idx) => (
                      <li key={idx} className="text-gray-700">
                        <span className="text-indigo-600 mr-2">✓</span>{country}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* States */}
              {locations.states && locations.states.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center">
                    <span className="text-xl">📍</span> <span className="ml-2">States</span>
                  </h3>
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {locations.states.map((state, idx) => (
                      <li key={idx} className="text-gray-700">
                        <span className="text-blue-600 mr-2">✓</span>{state}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cities */}
              {locations.cities && locations.cities.length > 0 && (
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-cyan-800 flex items-center">
                    <span className="text-xl">🏙️</span> <span className="ml-2">Cities</span>
                  </h3>
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {locations.cities.map((city, idx) => (
                      <li key={idx} className="text-gray-700">
                        <span className="text-cyan-600 mr-2">✓</span>{city}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pincodes */}
              {locations.pincodes && locations.pincodes.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-purple-800 flex items-center">
                    <span className="text-xl">📬</span> <span className="ml-2">Pin Codes</span>
                  </h3>
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {locations.pincodes.map((pin, idx) => (
                      <li key={idx} className="text-gray-700">
                        <span className="text-purple-600 mr-2">✓</span>{pin}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
    <Footer />
    </>
    
  );
};

export default About;
