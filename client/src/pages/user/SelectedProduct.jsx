import { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/Api.js';
import { 
  StarIcon, 
  ShoppingBasket01Icon, 
  SecurityCheckIcon, 
  DeliveryTruck01Icon, 
  ArrowLeft01Icon,
  InformationCircleIcon,
  Message01Icon,
  Share01Icon
} from 'hugeicons-react';

const SelectedProduct = () => {
    const { productId } = useParams();
    const { products, addToCart, navigate } = useContext(AuthContext);
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [size, setSize] = useState("");
    const [activeTab, setActiveTab] = useState("description");

    const fetchProductData = async () => {
        setLoading(true);
        const localProduct = products.find((item) => String(item._id) === String(productId));
        if (localProduct) {
            setProductData(localProduct);
            setLoading(false);
            return;
        }
        try {
            const response = await api.get(`/product/get/${productId}`);
            if (response?.data?.product) setProductData(response.data.product);
            else setLoadError('Product not found.');
        } catch (error) {
            setLoadError('Failed to load product details.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchProductData(); }, [productId, products]);

    useEffect(() => {
        if (!productData) return;
        const availableSizes = Array.isArray(productData.sizes) ? productData.sizes : [];
        setSize(availableSizes[0] || "");
    }, [productData]);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center font-['Plus_Jakarta_Sans']">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Sterilizing View...</p>
            </div>
        </div>
    );

    const rawImages = Array.isArray(productData.images) ? productData.images : [productData.images].filter(Boolean);
    const firstImage = rawImages[0] || '';
    const sizes = Array.isArray(productData.sizes) ? productData.sizes : [];

    return (
        <div className="bg-white min-h-screen font-['Plus_Jakarta_Sans']">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-8 md:py-16">
                {/* Back Button */}
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-10 group"
                >
                    <ArrowLeft01Icon size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Back to Pharmacy</span>
                </button>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
                    
                    {/* LEFT: IMAGE GALLERY */}
                    <div className="space-y-6">
                        <div className="relative group overflow-hidden bg-slate-50 rounded-[3rem] aspect-square border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]">
                            <img 
                                className="w-full h-full object-contain p-12 transition-transform duration-700 group-hover:scale-105" 
                                src={firstImage} 
                                alt={productData.name} 
                            />
                            {/* Actions Overlay */}
                            <div className="absolute top-6 right-6 flex flex-col gap-3">
                                <button className="p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm text-slate-900 hover:bg-white transition-all">
                                    <Share01Icon size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: PRODUCT INFO */}
                    <div className="flex flex-col">
                        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6 w-fit">
                            <SecurityCheckIcon size={16} className="text-blue-600" variant="bulk" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Certified Healthcare Product</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight mb-4">
                            {productData.name}
                        </h1>

                        <div className="flex items-center gap-6 mb-8">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <StarIcon key={i} size={18} className="text-amber-400" variant="bulk" />
                                ))}
                                <span className="ml-2 text-sm font-black text-slate-900">4.9</span>
                            </div>
                            <div className="h-4 w-[1px] bg-slate-200"></div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">120 Verified Reviews</span>
                        </div>

                        <div className="mb-10">
                            <span className="text-4xl font-black text-[#1A56DB] tracking-tighter">₹{productData.price}</span>
                            <span className="ml-4 text-slate-400 line-through font-bold">₹{Math.round(productData.price * 1.2)}</span>
                        </div>

                        <p className="text-slate-500 font-medium leading-relaxed mb-10 border-l-4 border-slate-100 pl-6">
                            {productData.description}
                        </p>

                        {/* Size Selection */}
                        {sizes.length > 0 && (
                            <div className="mb-10">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Select Dosage/Size</p>
                                <div className="flex flex-wrap gap-3">
                                    {sizes.map((item, index) => (
                                        <button 
                                            key={index}
                                            onClick={() => setSize(item)} 
                                            className={`min-w-[80px] py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
                                                ${item === size 
                                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 -translate-y-1' 
                                                    : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Main Action */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={() => addToCart(productData._id, size)} 
                                className="flex-1 bg-[#1A56DB] text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                            >
                                <ShoppingBasket01Icon size={20} variant="bulk" />
                                Add to Pharmacy Cart
                            </button>
                        </div>

                        {/* Trust Badges */}
                        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-100">
                            {[
                                { icon: <SecurityCheckIcon />, title: "100% Original", desc: "Direct from Lab" },
                                { icon: <DeliveryTruck01Icon />, title: "Free Shipping", desc: "Orders over ₹499" },
                                { icon: <Message01Icon />, title: "7 Day Returns", desc: "Hassle-free policy" }
                            ].map((badge, i) => (
                                <div key={i} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                                    <div className="text-[#0D9488] mb-2">{badge.icon}</div>
                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{badge.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-400">{badge.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TABS SECTION */}
                <div className="mt-32">
                    <div className="flex justify-center gap-8 mb-10 border-b border-slate-100">
                        {['description', 'reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-6 text-xs font-black uppercase tracking-[0.2em] transition-all relative
                                    ${activeTab === tab ? 'text-[#1A56DB]' : 'text-slate-300'}`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#1A56DB] rounded-full"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="max-w-4xl mx-auto py-10">
                        {activeTab === "description" ? (
                            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <InformationCircleIcon size={24} className="text-[#1A56DB]" />
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Product Specifications</h3>
                                </div>
                                <p className="text-slate-500 font-medium leading-[2] text-lg italic">
                                    "{productData?.description || "Technical details pending verification."}"
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[3rem]">
                                <Message01Icon size={48} className="mx-auto text-slate-200 mb-6" />
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">No Patient Reviews Yet</h4>
                                <p className="text-slate-400 font-bold mt-2">Be the first to share your experience with this medication.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default SelectedProduct;