import { Outlet } from "react-router-dom";
import DeliveryNavbar from "../components/DeliveryNavbar.jsx";
import DeliverySidebar from "../components/DeliverySidebar.jsx";

const DeliveryLayout = () => {
  return (
    <div className="flex min-h-screen">
      <DeliverySidebar />
      <div className="flex-1 bg-gray-100">
        <DeliveryNavbar />
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DeliveryLayout;
