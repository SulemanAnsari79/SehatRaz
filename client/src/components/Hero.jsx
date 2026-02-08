import React from "react";

const products = [
  { id: 1, name: "Vitamin C Tablets", price: "₹299", image: "/p1.jpg" },
  { id: 2, name: "Skin Care Cream", price: "₹499", image: "/p2.jpg" },
  { id: 3, name: "Blood Pressure Monitor", price: "₹1999", image: "/p3.jpg" },
  { id: 4, name: "Protein Powder", price: "₹1299", image: "/p4.jpg" },
  { id: 5, name: "Digital Thermometer", price: "₹199", image: "/p5.jpg" },
];

const Hero = () => {
  return (
    <div className="bg-green-50 py-10 overflow-hidden">
      
      {/* Heading */}
      <h2 className="text-3xl font-bold text-center mb-6">
        Trending Healthcare Products
      </h2>

      {/* Crawler Container */}
      <div className="relative w-full overflow-hidden">
        <div className="flex gap-6 animate-marquee">

          {/* Duplicate list for infinite effect */}
          {[...products, ...products].map((item, index) => (
            <div
              key={index}
              className="min-w-[250px] bg-white rounded-xl shadow-md p-4"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-40 w-full object-cover rounded-md"
              />
              <h3 className="mt-3 font-semibold">{item.name}</h3>
              <p className="text-green-600 font-bold">{item.price}</p>
              <button className="mt-3 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
                View Product
              </button>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
};

export default Hero;
