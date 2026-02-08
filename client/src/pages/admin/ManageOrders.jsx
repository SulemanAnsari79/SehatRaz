// import { useEffect, useState } from "react";
// import { getOrders } from "../../services/adminService.js";

const ManageOrders = () => {

  // const [orders,setOrders] = useState([]);

  // useEffect(()=>{
  //   getOrders().then(res=>setOrders(res.data));
  // },[]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Orders</h2>

      {/* {orders.map(o=>(
        <div key={o._id} className="bg-white p-3 mb-2 shadow">
          Order #{o._id} - {o.status}
        </div>
      ))} */}
    </div>
  );
};

export default ManageOrders;
