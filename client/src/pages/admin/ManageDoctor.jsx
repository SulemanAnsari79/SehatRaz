// import { useEffect, useState } from "react";
// import { getDoctors } from "../../services/adminService.js";

const ManageDoctors = () => {

  // const [doctors,setDoctors] = useState([]);

  // useEffect(()=>{
  //   getDoctors().then(res=>setDoctors(res.data));
  // },[]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Doctors</h2>

      {/* {doctors.map(d=>(
        <div key={d._id} className="bg-white p-3 mb-2 shadow">
          {d.specialization} - {d.verified ? "Verified" : "Pending"}
        </div>
      ))} */}
    </div>
  );
};

export default ManageDoctors;
