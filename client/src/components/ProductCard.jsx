import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart01Icon, ViewIcon, StarIcon } from 'hugeicons-react';
import { AuthContext } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(AuthContext);

  const handleAddToCart = () => {
    addToCart(product._id);
  };

  return (
    <div className="group relative bg-white rounded-[2rem] p-4 border border-slate-100 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(26,86,219,0.08)] hover:-translate-y-2 font-['Plus_Jakarta_Sans']">
      
      {/* Product Image Container */}
      <div className="relative overflow-hidden rounded-[1.5rem] aspect-square bg-slate-50">
        <img 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          src={product.images && product.images[0] ? product.images[0] : '/placeholder-image.jpg'} 
          alt={product.name} 
        />
        
        {/* Quick Price Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/50">
          <p className="text-xs font-black text-slate-900">₹{product.price}</p>
        </div>

        {/* Floating Category Tag */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-slate-900/10 text-slate-900 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-white/20">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="mt-5 px-1 pb-2">
        <div className="flex items-center gap-1 mb-1">
          <StarIcon size={12} variant="bulk" className="text-amber-400" />
          <span className="text-[10px] font-bold text-slate-400">4.8 (120 Reviews)</span>
        </div>

        <h3 className="text-[15px] font-black text-slate-900 tracking-tight leading-snug line-clamp-1">
          {product.name}
        </h3>

        <div className="mt-4 flex items-center gap-2">
          <Link 
            to={`/product/${product._id}`} 
            className="flex-1 flex items-center justify-center gap-2 bg-slate-50 text-slate-900 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#1A56DB] hover:text-white transition-all"
          >
            <ViewIcon size={16} />
            Details
          </Link>
          
          <button
            onClick={handleAddToCart}
            className="p-3 bg-slate-900 text-white rounded-xl hover:bg-[#0D9488] transition-colors shadow-lg shadow-slate-200 hover:shadow-none"
          >
            <ShoppingCart01Icon size={18} variant="bulk" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;