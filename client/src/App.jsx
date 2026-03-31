import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/user/Home.jsx";
import Products from "./pages/user/Products.jsx";
import About from "./pages/user/About.jsx";
import Contact from "./pages/user/Contact.jsx";
import Cart from "./pages/user/Cart.jsx";
import Login from "./pages/Login";
import SelectedProduct from "./pages/user/SelectedProduct.jsx";

import PrivateRoute from "./routes/PrivateRoute";
import DoctorRoute from "./routes/DoctorRoute";
import DeliveryRoute from "./routes/DeliveryRoute.jsx";

import Recommendation from "./pages/user/Recommendation.jsx";
import Appointment from "./pages/user/Appointment.jsx";
import Profile from "./pages/user/Profile.jsx";
import MyAppointments from "./pages/user/MyAppointments.jsx";
import Checkout from "./pages/user/Checkout.jsx";
import PlaceOrder from "./pages/user/PlaceOrder.jsx";
import Doctors from "./pages/user/Doctors.jsx";
import OnlineConsultation from "./pages/OnlineConsultation.jsx";
 

import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./layouts/AdminLayout.jsx";
import ManageUsers from "./pages/admin/ManageUser.jsx";
import ManageDoctors from "./pages/admin/ManageDoctor.jsx";
import LeaveRequests from "./pages/admin/LeaveRequests.jsx";
import ManageOrders from "./pages/admin/ManageOrders.jsx";
import ManageOrderRequests from "./pages/admin/ManageOrderRequests.jsx";
import ManageProducts from "./pages/admin/ManageProduct.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ManageDeliveryMen from "./pages/admin/ManageDeliveryMen.jsx";
import ManageAppointments from "./pages/admin/ManageAppointments.jsx";
import Notices from "./pages/admin/Notices.jsx";
import DoctorLayout from "./layouts/DoctorLayout.jsx";

import DoctorDashboard from "./pages/doctor/DoctorDashboard.jsx";
import Appointments from "./pages/doctor/Appointments.jsx";
import Patients from "./pages/doctor/Patients.jsx";
import DoctorProfile from "./pages/doctor/DoctorProfile.jsx";

import DeliveryLayout from "./layouts/DeliveryLayout.jsx";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard.jsx";

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
          <Route path='/product/:productId' element={<SelectedProduct />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
    

          {/* USER */}
          <Route element={<PrivateRoute />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/recommended" element={<Recommendation />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/bookappointment" element={<Appointment />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/consultation/:appointmentId" element={<OnlineConsultation />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/place-order" element={<PlaceOrder />} /> 
          </Route>


          {/* ADMIN */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout/>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="doctors" element={<ManageDoctors />} />
            <Route path="appointments" element={<ManageAppointments />} />
            <Route path="leave-requests" element={<LeaveRequests />} />
            <Route path="orders" element={<ManageOrders />} />
            <Route path="order-requests" element={<ManageOrderRequests />} />
            <Route path="products" element={<ManageProducts />} />
            <Route path="delivery-men" element={<ManageDeliveryMen />} />
            <Route path="notices" element={<Notices />} />
          </Route>
          </Route>


          {/* DOCTOR */}
          <Route element={<DoctorRoute />}>
            <Route path="/doctor" element={<DoctorLayout />}>
            <Route index element={<DoctorDashboard />} />
            <Route path="appointments" element={<Appointments />} /> 
            <Route path="patients" element={<Patients />} /> 
            <Route path="profile" element={<DoctorProfile />} />  
            <Route path="consultation/:appointmentId" element={<OnlineConsultation />} />
            </ Route >
          </Route>

          {/* DELIVERY MAN */}
          <Route element={<DeliveryRoute />}>
            <Route path="/delivery" element={<DeliveryLayout />}>
              <Route index element={<DeliveryDashboard />} />
              <Route path="orders" element={<DeliveryDashboard />} />
            </Route>
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

