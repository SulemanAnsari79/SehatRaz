import React, { useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";


const Products = () => {

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(['All']);
  const {products} = useContext(AuthContext);

  const filteredProducts = products.filter((product) => {
    return (
      product.name.toLowerCase().includes(search.toLowerCase()) &&
      (category.includes("All") || category.includes("Suppliments")  && product.category === "Suppliments" || category.includes("Skin Care") && product.category === "Skin Care" || category.includes("tool") && product.category === "tool")
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
          <option value="Suppliments">Suppliments</option>
          <option value="Skin Care">Skin Care</option>
          <option value="tool">Tools</option>
        </select>

      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
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
