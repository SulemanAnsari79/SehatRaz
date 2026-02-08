// import { useEffect, useState } from "react";
// import { getProducts } from "../../services/adminService.js";

const ManageProducts = () => {

  // const [products,setProducts] = useState([]);

  // useEffect(()=>{
  //   getProducts().then(res=>setProducts(res.data));
  // },[]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Products</h2>

      {/* {products.map(p=>(
        <div key={p._id} className="bg-white p-3 mb-2 shadow">
          {p.name} - ₹{p.price}
        </div>
      ))} */}
    </div>
  );
};

export default ManageProducts;
