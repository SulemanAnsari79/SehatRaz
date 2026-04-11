import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { Search01Icon, FilterIcon, Medicine01Icon, DropletIcon, Settings03Icon } from 'hugeicons-react';

const Products = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { products } = useContext(AuthContext);

  const categories = [
    { id: 'All', label: 'All Items', icon: <FilterIcon size={18}/> },
    { id: 'Suppliments', label: 'Supplements', icon: <Medicine01Icon size={18}/> },
    { id: 'Skin Care', label: 'Skin Care', icon: <DropletIcon size={18}/> },
    { id: 'tool', label: 'Medical Tools', icon: <Settings03Icon size={18}/> },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#fafbfc] min-h-screen font-['Plus_Jakarta_Sans']">
      <Navbar />

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
                The Sehat<span className="text-[#1A56DB]">raz</span> Pharmacy
            </h1>
            <p className="text-slate-500 font-medium">Verified products delivered to Delhi & UP</p>
        </div>

        {/* Premium Search & Filter Bar */}
        <div className="flex flex-col gap-8 mb-16">
          
          {/* Search Box */}
          <div className="max-w-2xl mx-auto w-full group">
            <div className="flex items-center bg-white border border-slate-200 rounded-[2rem] p-2 transition-all duration-300 focus-within:border-[#1A56DB] focus-within:shadow-[0_10px_30px_rgba(26,86,219,0.05)]">
               <div className="pl-4 pr-2"><Search01Icon size={22} className="text-slate-400" /></div>
               <input
                 type="text"
                 placeholder="Search by name, brand or condition..."
                 className="w-full bg-transparent p-3 outline-none font-bold text-slate-800"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
                  ${category === cat.id 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                    : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300'
                  }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
            <p className="text-sm font-bold text-slate-400">
                Showing <span className="text-slate-900">{filteredProducts.length}</span> results
            </p>
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 cursor-pointer">
                SORT BY: <span className="text-[#1A56DB]">POPULARITY</span>
            </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
               <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search01Icon size={30} />
               </div>
               <h3 className="text-xl font-black text-slate-900 mb-2">No matching medications</h3>
               <p className="text-slate-500 font-medium">Try checking your spelling or selecting "All Items"</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Products;