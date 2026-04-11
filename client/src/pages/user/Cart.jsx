import React, { useMemo, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { toast } from "react-toastify";
import { 
  ShoppingBasket01Icon, 
  Delete02Icon, 
  Add01Icon, 
  Remove01Icon, 
  DeliveryTruck01Icon, 
  // Secure02Icon, 
  ArrowRight01Icon 
} from 'hugeicons-react';

const Cart = () => {
  const { products, cartItems, updateQuantity, currency, navigate, delivery_fee, getCartAmount } = useContext(AuthContext);

  const cartList = useMemo(() => {
    const items = [];
    for (const itemId in cartItems) {
      const sizeMap = cartItems[itemId];
      const product = products.find((p) => p._id === itemId);
      if (!product) continue;
      for (const size in sizeMap) {
        const quantity = sizeMap[size];
        if (quantity > 0) {
          const images = Array.isArray(product.images) ? product.images : [product.images].filter(Boolean);
          items.push({
            key: `${itemId}-${size}`,
            itemId,
            size,
            quantity,
            product,
            image: images[0] || "/placeholder-image.jpg",
          });
        }
      }
    }
    return items;
  }, [cartItems, products]);

  const totalItems = cartList.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = getCartAmount();
  const deliveryFee = cartList.length > 0 ? delivery_fee : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="bg-[#fafbfc] min-h-screen font-['Plus_Jakarta_Sans']">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
              Shopping <span className="text-[#1A56DB]">Cart</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 uppercase text-[11px] tracking-widest">
              Review your medications & wellness items
            </p>
          </div>
          <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 flex items-center gap-3">
             {/* <Secure02Icon size={20} className="text-[#1A56DB]" variant="bulk" /> */}
             <span className="text-[12px] font-black text-[#1A56DB] uppercase">SSL Secured Checkout</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* LEFT: CART ITEMS LIST */}
          <div className="lg:col-span-8 space-y-6">
            {cartList.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                   <ShoppingBasket01Icon size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Your basket is empty</h3>
                <p className="text-slate-500 font-medium mb-8">Looks like you haven't added any health products yet.</p>
                <Link to="/products" className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A56DB] transition-all">
                  Browse Pharmacy <ArrowRight01Icon size={18} />
                </Link>
              </div>
            ) : (
              cartList.map((item) => (
                <div key={item.key} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 flex flex-col sm:flex-row gap-6 items-center hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                  {/* Image Container */}
                  <div className="w-32 h-32 bg-slate-50 rounded-[1.5rem] overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{item.product.name}</h3>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2">
                       <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Size: {item.size}</span>
                       <span className="text-[10px] font-black uppercase text-[#0D9488]">In Stock</span>
                    </div>
                    <p className="text-xl font-black text-[#1A56DB] mt-3">
                      {currency === "INR" ? "₹" : currency}{item.product.price}
                    </p>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <button 
                      onClick={() => updateQuantity(item.itemId, item.size, Math.max(1, item.quantity - 1))}
                      className="p-2 hover:bg-white hover:text-[#1A56DB] rounded-xl transition-all"
                    >
                      <Remove01Icon size={18} />
                    </button>
                    <span className="font-black text-slate-900 w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.itemId, item.size, item.quantity + 1)}
                      className="p-2 hover:bg-white hover:text-[#1A56DB] rounded-xl transition-all"
                    >
                      <Add01Icon size={18} />
                    </button>
                  </div>

                  {/* Remove Action */}
                  <button 
                    onClick={() => updateQuantity(item.itemId, item.size, 0)}
                    className="p-4 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Delete02Icon size={24} variant="bulk" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl sticky top-32">
              <h2 className="text-2xl font-black mb-8 tracking-tighter">Order Summary</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-4 border-b border-white/10">
                  <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Items</span>
                  <span className="font-black">{totalItems}</span>
                </div>

                <div className="flex justify-between items-center py-4 border-b border-white/10">
                  <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Subtotal</span>
                  <span className="font-black">{currency === "INR" ? "₹" : currency}{subtotal}</span>
                </div>

                <div className="flex justify-between items-center py-4">
                  <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Delivery</span>
                  <span className="text-teal-400 font-black">
                    {deliveryFee === 0 ? "FREE" : `${currency === "INR" ? "₹" : currency}${deliveryFee}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-10">
                <span className="text-lg font-black tracking-tight">Total Amount</span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                  {currency === "INR" ? "₹" : currency}{total}
                </span>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => cartList.length > 0 ? navigate('/checkout') : toast.error("Basket is empty!")} 
                  className="w-full bg-[#1A56DB] text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/40 hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Confirm & Checkout <ArrowRight01Icon size={18} />
                </button>
                
                <div className="flex items-center justify-center gap-2 text-slate-500 pt-4">
                  <DeliveryTruck01Icon size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Next day delivery in Delhi/UP</span>
                </div>
              </div>
            </div>

            {/* Support Micro-card */}
            <div className="mt-6 bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
               <div className="w-10 h-10 bg-teal-50 text-[#0D9488] rounded-xl flex items-center justify-center">
                  {/* <Secure02Icon size={20} variant="bulk" /> */}
               </div>
               <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">Secure Platform</h4>
                  <p className="text-[10px] font-bold text-slate-400">Your medical data is encrypted</p>
               </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;