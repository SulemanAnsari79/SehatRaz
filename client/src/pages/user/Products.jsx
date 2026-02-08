import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const productData = [
  { id: 1, name: "Vitamin C Tablets", price: 299, category: "Supplements", image: "/p1.jpg" },
  { id: 2, name: "Skin Care Cream", price: 499, category: "Skin Care", image: "/p2.jpg" },
  { id: 3, name: "Blood Pressure Monitor", price: 1999, category: "Devices", image: "/p3.jpg" },
  { id: 4, name: "Protein Powder", price: 1299, category: "Supplements", image: "/p4.jpg" },
  { id: 5, name: "Digital Thermometer", price: 199, category: "Devices", image: "/p5.jpg" },
];

const Products = () => {

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredProducts = productData.filter((product) => {
    return (
      product.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All" || product.category === category)
    );
  });

  return (
    
    <>
    <Navbar />
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <h2 className="text-3xl font-bold text-center mb-8">
        All Products
      </h2>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">

        {/* Search */}
        <input
          type="text"
          placeholder="Search products..."
          className="border p-2 rounded w-full md:w-1/2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Category Filter */}
        <select
          className="border p-2 rounded w-full md:w-1/4"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Supplements">Supplements</option>
          <option value="Skin Care">Skin Care</option>
          <option value="Devices">Devices</option>
        </select>

      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-40 w-full object-cover rounded"
              />

              <h3 className="mt-3 font-semibold">
                {product.name}
              </h3>

              <p className="text-green-600 font-bold">
                ₹{product.price}
              </p>

              <button className="mt-3 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
                Add to Cart
              </button>
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-500">
            No products found.
          </p>
        )}

      </div>
    </div>
    <Footer />
    </>
  );
};

export default Products;
