import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import ProductCard from "./ProductCard";
const Hero = () => {
  // const [products, setProducts] = useState([]);
  // const [loading, setLoading] = useState(true);

  const {products} = useContext(AuthContext);
  // const [loading, setLoading] = useState(false);


  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-10 overflow-hidden">
      
      {/* Heading */}
      <h2 className="text-3xl font-bold text-center mb-6">
        Trending Healthcare Products
      </h2>

      {/* Crawler Container */}
      <div className="relative w-full overflow-hidden">
        <div className="flex gap-6 animate-marquee">
          
          {/* Duplicate list for infinite effect */}
          {[...products, ...products].map((item, index) => (
            <ProductCard key={index} product={item} />
          ))}

        </div>
      </div>

    </div>
  );
};

export default Hero;
