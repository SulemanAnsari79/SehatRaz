// import React from 'react'
// import { Routes, Route } from "react-router-dom";
// import Login from "./pages/user/Login";
// import Home from "./pages/user/Home";
// import Cart from "./pages/user/Cart";
// import ProtectedRoute from "./components/ProtectedRoute";

// const App = () => {
//   return (
//       <Routes>

//       <Route path="/login" element={<Login />} />
      
//       <Route path="/cart"element={<ProtectedRoute><Cart /></ProtectedRoute>}/>

//       <Route path="/" element={<Home />} />
      
//       </Routes>
//   )
// }

// export default App


// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import AdminRoute from "./routes/AdminRoute.jsx";
// import AdminLayout from "./layouts/AdminLayout.jsx";

// import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
// import ManageUser from "./pages/admin/ManageUser.jsx";
// import ManageDoctor from "./pages/admin/ManageDoctor.jsx";
// import ManageProduct from "./pages/admin/ManageProduct.jsx";
// import ManageOrders from "./pages/admin/ManageOrders.jsx";
// import Login from "./pages/user/Login.jsx";

// const App=()=> {
//   return (
//     <BrowserRouter>
//       <Routes>

//         {/* Public */}
//         <Route path="/" element={<Login />} />

//         <Route element={<UserRoute />}>
//           <Route element={<UserLayout />}>
//             <Route path="/user" element={<Home />} />
//             <Route path="/user/product" element={<Product />} />
//             <Route path="/user/about" element={<About />} />
//             <Route path="/user/contact" element={<Contact />} />
//             <Route path="/user/cart" element={<Cart />} />

//           </Route>
//         </Route>

//         {/* Protected Admin  */}
//         <Route element={<AdminRoute />}>
//           <Route element={<AdminLayout />}>
//             <Route path="/admin" element={<AdminDashboard />} />
//             <Route path="/admin/users" element={<ManageUser />} />
//             <Route path="/admin/doctors" element={<ManageDoctor />} />
//             <Route path="/admin/products" element={<ManageProduct />} />
//             <Route path="/admin/orders" element={<ManageOrders />} />

//           </Route>
//         </Route>

//         {/* Protected Doctor  */}
//         <Route element={<DoctorRoute />}>
//           <Route element={<DoctorLayout />}>
//             <Route path="/doctor" element={<DoctorDashboard />} />
//             <Route path="/doctor/" element={<Product />} />
//             <Route path="/doctor/" element={<About />} />
//             <Route path="/doctor/" element={<Contact />} />
//           </Route>
//         </Route>

//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;


import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/user/Home.jsx";
import Products from "./pages/user/Products.jsx";
import About from "./pages/user/About.jsx";
import Contact from "./pages/user/Contact.jsx";
import Cart from "./pages/user/Cart.jsx";
import Login from "./pages/Login";

import PrivateRoute from "./routes/PrivateRoute";
import DoctorRoute from "./routes/DoctorRoute";

import Recommendation from "./pages/user/Recommendation.jsx";
import Appointment from "./pages/user/Appointment.jsx";
import Profile from "./pages/user/Profile.jsx";
import Checkout from "./pages/user/Checkout.jsx";
import PlaceOrder from "./pages/user/PlaceOrder.jsx";

import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./layouts/AdminLayout.jsx";
import ManageUsers from "./pages/admin/ManageUser.jsx";
import ManageDoctors from "./pages/admin/ManageDoctor.jsx";
import ManageOrders from "./pages/admin/ManageOrders.jsx";
import ManageProducts from "./pages/admin/ManageProduct.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import DoctorLayout from "./layouts/DoctorLayout.jsx";

import DoctorDashboard from "./pages/doctor/DoctorDashboard.jsx";
import Appointments from "./pages/doctor/Appointments.jsx";
import Patients from "./pages/doctor/Patients.jsx";
import DoctorProfile from "./pages/doctor/DoctorProfile.jsx";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthProvider from "./context/AuthContext.jsx";


function App() {
  return (
    <BrowserRouter>
    <AuthProvider>
      <ToastContainer />
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
 
        
        {/* USER */}
        <Route element={<PrivateRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/recommended" element={<Recommendation />} />
          <Route path="/bookappointment" element={<Appointment />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/placeorder" element={<PlaceOrder />} /> 
        </Route>


        {/* ADMIN */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout/>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="doctors" element={<ManageDoctors />} />
          <Route path="orders" element={<ManageOrders />} />
          <Route path="products" element={<ManageProducts />} />
        </Route>
        </Route>


        {/* DOCTOR */}
        <Route element={<DoctorRoute />}>
          <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<Appointments />} /> 
          <Route path="patients" element={<Patients />} /> 
          <Route path="profile" element={<DoctorProfile />} />  
          </ Route >
        </Route>

      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

