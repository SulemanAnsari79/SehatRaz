import React from 'react'
import { Link } from 'react-router-dom'

const ProductCard = ({ product }) => {
  return (
    <div className="border p-4 flex flex-col rounded-xl">
      <div className='overflow-hidden size-65 rounded-xl'>
            <img className='hover:scale-110 transition ease-in-out object-cover' src={product.images && product.images[0] ? product.images[0] : '/placeholder-image.jpg'} alt={product.name} />
        </div>
        <div className='flex justify-between'>
        <p className='pt-3 pb-1 text-sm font-bold'>{product.name}</p>
        <p className='text-sm font-medium mt-2.5'>₹{product.price}</p>
        </div>
        < Link to={`/product/${product._id}`} ><button className='mt-2 bg-black text-white px-4 py-1 text-xs rounded'>View Details</button></Link>
    </div>
  )
}

export default ProductCard
