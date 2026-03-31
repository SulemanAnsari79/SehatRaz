import { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { FiStar } from 'react-icons/fi';

const SelectedProduct = () => {
    const { productId } = useParams();
    const { products, addToCart } = useContext(AuthContext);
    const [productData, setProductData] = useState(null);
    const [size, setSize] = useState("");
    // const [selectedSize, setSelectedSize] = useState("");

    const fetchProductData = async () => {

      products.map((item) => {
        if (item._id === productId) {
          setProductData(item);
          return null;
        }
      });
    } 
    useEffect(() => {
      fetchProductData();
    }, [productId, products]);

    if (!productData) {
      return (
        <>
          <Navbar />
          <div className='p-6 bg-gray-50 min-h-screen'>Loading product...</div>
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
               <button onClick={() => size ? addToCart(productData._id, size) : alert('Please select a size')} className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700 w-1/2'>ADD TO CART</button>
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
             <b className='border px-5 py-3 text-sm '>Description</b>
             <p className='border px-5 py-3 text-sm '>Reviews</p>
           </div>
           <div className='flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500'>
             <p>{productData?.description}</p>
             {/* <p>E-commerce website typically display products or services along with detailed description,images ,price and may availabe variations eg(sizes,colors).Each product usually has its own dedicated page with relevent information</p> */}
           </div>
         </div>
         </div>
         <Footer />
         </>
    )  
}
export default SelectedProduct
