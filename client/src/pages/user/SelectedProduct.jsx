import { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { FiStar } from 'react-icons/fi';
import api from '../../services/Api.js';

const SelectedProduct = () => {
    const { productId } = useParams();
    const { products, addToCart } = useContext(AuthContext);
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [size, setSize] = useState("");
    const [activeTab, setActiveTab] = useState("description");
    // const [selectedSize, setSelectedSize] = useState("");

    const fetchProductData = async () => {
      setLoading(true);
      setLoadError('');

      const localProduct = products.find((item) => String(item._id) === String(productId));
      if (localProduct) {
        setProductData(localProduct);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/product/get/${productId}`);
        const remoteProduct = response?.data?.product;
        if (remoteProduct) {
          setProductData(remoteProduct);
        } else {
          setLoadError('Product not found.');
        }
      } catch (error) {
        setLoadError(error?.response?.data?.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    }
    useEffect(() => {
      fetchProductData();
    }, [productId, products]);

    useEffect(() => {
      if (!productData) return;
      const availableSizes = Array.isArray(productData.sizes) ? productData.sizes : [];
      const mediumSize = availableSizes.find((s) => String(s).toUpperCase() === "M");
      const defaultSize = mediumSize || availableSizes[0] || "";
      setSize(defaultSize);
    }, [productData]);

    if (loading) {
      return (
        <>
          <Navbar />
          <div className='p-6 bg-gray-50 min-h-screen'>Loading product...</div>
          <Footer />
        </>
      );
    }

    if (!productData) {
      return (
        <>
          <Navbar />
          <div className='p-6 bg-gray-50 min-h-screen text-center'>
            <p className='text-gray-700 font-semibold'>{loadError || 'Product not available.'}</p>
          </div>
          <Footer />
        </>
      );
    }

    const rawImages = Array.isArray(productData.images)
      ? productData.images
      : Array.isArray(productData.image)
      ? productData.image
      : [productData.images || productData.image].filter(Boolean);
    const firstImage = rawImages[0] || '';
    const sizes = Array.isArray(productData.sizes) ? productData.sizes : [];

     return (
       <>
       <Navbar />
       <div className='p-6 bg-gray-50 min-h-screen transition-opacity ease-in duration-500 opacity-100'>
        <h1 className='text-5xl font-bold mt-5 mb-10  text-center'>{productData.name}</h1>
         {/* Product data */}
         <div className='flex flex-col gap-8 md:flex-row'>

           {/*Product images  */}
           <div className='w-full md:w-1/2'>
             {firstImage ? (
               <img className='w-full h-150 object-cover rounded-lg' src={firstImage} alt={productData.name || 'Product'} />
             ) : (
               <div className='text-sm text-gray-500'>No image available.</div>
             )}
           </div>


           {/*--------------------- Product Information------------------- */}
           <div className='w-full md:w-1/2'>
             <h1 className='font-medium text-2xl mt-2'>{productData.name}</h1>
             <div className='flex items-center gap-1 mt-2'>
                 <FiStar className='w-4' />
                 <FiStar className='w-4' />
                 <FiStar className='w-4' />
                 <FiStar className='w-4' />
                 <FiStar className='w-4' />
             </div>
             <p className='mt-5 text-3xl font-medium'>₹{productData.price}</p>
             <p className='mt-5 text-gray-500 md:w-4/5'>{productData.description}</p>
             <div className='flex flex-col gap-4 my-8'>
               <p>Select size</p>
               <div className='flex gap-2'>
                 {sizes.length > 0 ? (
                   sizes.map((item, index) => (
                     <button onClick={() => setSize(item)} className={`border py-2 px-4 bg-gray-200 ${item === size ? 'border-orange-500' : ''}`} key={index} >{item}</button>
                   ))
                 ) : (
                   <span className='text-sm text-gray-500'>No sizes available.</span>
                 )}
               </div>
               <button onClick={() => addToCart(productData._id, size)} className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700 w-1/2'>ADD TO CART</button>
               <hr className='mt-8 sm:w-4/5' />
               <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
                 <p>100% Original Product</p>
                 <p>Cash on delivery is available on this product</p>
                 <p>Easy return and exchange policy within 7 days</p>
               </div>
             </div>
           </div>
         </div>
         {/* ---------------Description and review section---------------- */}
         <div className='mt-20'>
           <div className='flex'>
             <button
               type='button'
               onClick={() => setActiveTab("description")}
               className={`border px-5 py-3 text-sm font-semibold ${activeTab === "description" ? "bg-white" : "bg-gray-100 text-gray-500"}`}
             >
               Description
             </button>
             <button
               type='button'
               onClick={() => setActiveTab("reviews")}
               className={`border px-5 py-3 text-sm font-semibold ${activeTab === "reviews" ? "bg-white" : "bg-gray-100 text-gray-500"}`}
             >
               Reviews
             </button>
           </div>
           <div className='flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500'>
             {activeTab === "description" ? (
               <p>{productData?.description || "No description available for this product."}</p>
             ) : (
               <>
                 <p className='font-medium text-gray-700'>Customer Reviews</p>
                 <p>This product does not have verified reviews yet.</p>
                 <p>Be the first customer to purchase and share your feedback.</p>
               </>
             )}
           </div>
         </div>
         </div>
         <Footer />
         </>
    )  
}
export default SelectedProduct
