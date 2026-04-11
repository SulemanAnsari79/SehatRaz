import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { 
  // TruckDelivery01Icon, 
  CreditCardIcon, 
  Wallet01Icon, 
  UserCircleIcon, 
  Mail01Icon, 
  TelephoneIcon, 
  Location01Icon, 
  City01Icon, 
  Message01Icon, 
  // Secure02Icon,
  CheckmarkBadge01Icon
} from 'hugeicons-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { user, token, cartItems, products, delivery_fee, currency, backendUrl, clearCart } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const normalizedBackendUrl = backendUrl.replace(/\/+$/, '');

  const [shipping, setShipping] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    zip: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShipping({ ...shipping, [name]: value });
  };

  const getOrderItems = () => {
    const items = [];
    for (const itemId in cartItems) {
      const sizeMap = cartItems[itemId];
      const product = products.find((p) => p._id === itemId);
      if (!product) continue;
      for (const size in sizeMap) {
        const quantity = sizeMap[size];
        if (quantity > 0) {
          items.push({
            productId: itemId,
            name: product.name,
            price: product.price,
            quantity,
            size,
            image: Array.isArray(product.images) ? product.images[0] : product.images
          });
        }
      }
    }
    return items;
  };

  const orderItems = getOrderItems();
  const cartTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = cartTotal + delivery_fee;

  const validateForm = () => {
    const { fullName, email, phone, address, city, state, zip } = shipping;
    if (!fullName || !email || !phone || !address || !city || !state || !zip) {
      toast.error("Please fill all mandatory fields");
      return false;
    }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      toast.error("Enter a valid 10-digit phone number");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    if (!token) { toast.error("Please login first"); navigate("/login"); return; }

    setIsLoading(true);
    try {
      if (paymentMethod === "cod") {
        const response = await axios.post(`${normalizedBackendUrl}/api/order/placeorder`, {
          items: orderItems,
          paymentMethod: "Cash On Delivery",
          shippingDetails: shipping,
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (response.data.success) {
          toast.success("Order Placed!");
          clearCart();
          navigate("/place-order");
        }
      } else {
        const sdkReady = await loadRazorpayScript();
        if (!sdkReady) return toast.error("Gateway error");
        
        const createPaymentOrder = await axios.post(`${normalizedBackendUrl}/api/order/create-online-order`, {
          items: orderItems,
          shippingDetails: shipping,
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (createPaymentOrder.data.success) {
          const paymentOrder = createPaymentOrder.data;
          const options = {
            key: paymentOrder.keyId,
            amount: paymentOrder.amount,
            order_id: paymentOrder.razorpayOrderId,
            name: "SehatRaz",
            theme: { color: "#1A56DB" },
            handler: async (rzpResponse) => {
              const verify = await axios.post(`${normalizedBackendUrl}/api/order/verify-online-payment`, {
                orderId: paymentOrder.orderId,
                ...rzpResponse
              }, { headers: { Authorization: `Bearer ${token}` } });
              if (verify.data.success) { clearCart(); navigate("/place-order"); }
            }
          };
          new window.Razorpay(options).open();
        }
      }
    } catch (e) { toast.error("Order failed"); } finally { setIsLoading(false); }
  };

  return (
    <div className="bg-[#fafbfc] min-h-screen font-['Plus_Jakarta_Sans']">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Secure <span className="text-[#1A56DB]">Checkout</span></h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Delhi & UP Express Terminal</p>
            </div>
            <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-100">
                {/* <Secure02Icon size={20} className="text-[#0D9488]" variant="bulk" /> */}
                <span className="text-xs font-black text-slate-600 uppercase">Bank-grade Encryption</span>
            </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* LEFT: FORMS */}
          <div className="lg:col-span-8 space-y-10">
            <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-3">
                {/* <TruckDelivery01Icon size={24} className="text-[#1A56DB]" variant="bulk" /> */}
                Delivery Information
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {[
                  { label: "Recipient Name", name: "fullName", icon: <UserCircleIcon size={18}/>, placeholder: "Enter full name" },
                  { label: "Email Contact", name: "email", icon: <Mail01Icon size={18}/>, placeholder: "Enter email" },
                  { label: "Mobile Number", name: "phone", icon: <TelephoneIcon size={18}/>, placeholder: "10-digit number" },
                  { label: "Complete Address", name: "address", icon: <Location01Icon size={18}/>, placeholder: "House/Flat No, Street" },
                  { label: "City", name: "city", icon: <City01Icon size={18}/>, placeholder: "Enter city" },
                  { label: "State", name: "state", icon: <Message01Icon size={18}/>, placeholder: "Enter state" },
                  { label: "PIN Code", name: "zip", icon: <Location01Icon size={18}/>, placeholder: "6-digit PIN" },
                ].map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-4 tracking-widest">{field.label}</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1A56DB] transition-colors">{field.icon}</div>
                      <input 
                        name={field.name} 
                        value={shipping[field.name]} 
                        onChange={handleChange} 
                        placeholder={field.placeholder}
                        type={field.name === "email" ? "email" : field.name === "phone" ? "tel" : "text"}
                        maxLength={field.name === "phone" ? 10 : field.name === "zip" ? 6 : undefined}
                        className="w-full bg-slate-50 border-none pl-12 p-4 rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-10">Select Payment Method</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { id: 'cod', label: 'Cash on Delivery', icon: <Wallet01Icon size={24}/>, desc: 'Pay when meds arrive' },
                  { id: 'razorpay', label: 'Online Payment', icon: <CreditCardIcon size={24}/>, desc: 'Cards, UPI, Wallets' }
                ].map((method) => (
                  <button 
                    key={method.id} 
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-6 rounded-[2rem] border-2 text-left transition-all duration-300 ${paymentMethod === method.id ? 'border-[#1A56DB] bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className={`${paymentMethod === method.id ? 'text-[#1A56DB]' : 'text-slate-400'} mb-4 transition-colors`}>{method.icon}</div>
                    <h4 className="font-black text-slate-900 tracking-tight">{method.label}</h4>
                    <p className="text-xs font-bold text-slate-400">{method.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY BENTO */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl sticky top-32 overflow-hidden relative">
              {/* Abstract bg element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
              
              <h2 className="text-2xl font-black mb-8 tracking-tighter relative">Order Summary</h2>

              <div className="space-y-4 mb-8 relative max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {orderItems.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex justify-between items-center py-3 border-b border-white/5">
                    <div>
                        <p className="text-xs font-black text-white line-clamp-1">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.size} × {item.quantity}</p>
                    </div>
                    <span className="font-black text-sm">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-10 relative">
                <div className="flex justify-between text-slate-400 text-xs font-black uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-[#0D9488] text-xs font-black uppercase tracking-widest">
                  <span>Delivery Fee</span>
                  <span>{delivery_fee === 0 ? "FREE" : `₹${delivery_fee}`}</span>
                </div>
                <div className="h-[1px] bg-white/10 my-4"></div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black tracking-tight">Total Due</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                    ₹{totalAmount}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isLoading || orderItems.length === 0}
                className="w-full relative group bg-[#1A56DB] text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/40 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-3">
                    {isLoading ? "Authenticating..." : "Finalize Order"}
                    <CheckmarkBadge01Icon size={18} variant="bulk" className="group-hover:rotate-12 transition-transform" />
                </span>
              </button>
              
              <p className="text-center text-[10px] font-bold text-slate-500 mt-6 tracking-widest uppercase">
                Estimated Delivery: 24-48 Hours
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Checkout;