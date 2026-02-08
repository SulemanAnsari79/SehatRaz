import React from 'react'
import { Outlet } from 'react-router-dom';
import DoctorNavbar from '../components/DoctorNavbar.jsx';
import DoctorSidebar from '../components/DoctorSidebar.jsx';

const DoctorLayout = () => {
  return (
    <div className="flex min-h-screen">
    <DoctorSidebar />
      <div className="flex-1 bg-gray-100">
      <DoctorNavbar />
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DoctorLayout
