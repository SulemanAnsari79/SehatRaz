import React from 'react'
import { Outlet } from 'react-router-dom';
import DoctorNavbar from '../components/DoctorNavbar.jsx';
import DoctorSidebar from '../components/DoctorSidebar.jsx';

const DoctorLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DoctorNavbar />
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DoctorLayout
