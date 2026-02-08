// import { useEffect, useState } from "react";
// import { getUsers } from "../../services/adminService.js";


const ManageUsers = () => {

  // const [users,setUsers] = useState([]);

  // useEffect(()=>{
  //   getUsers().then(res=>setUsers(res.data));
  // },[]);

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Users</h2>

      <table className="w-full bg-white shadow">
        <thead>
          <tr>
            <th className="p-2">Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        {/* <tbody>
          {users.map(u=>(
            <tr key={u._id}>
              <td className="p-2">{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody> */}
      </table>
    </ >
  );
};

export default ManageUsers;
