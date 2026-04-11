// Home.jsx
import React from 'react'
import Navbar from '../../components/Navbar.jsx'
import Hero from '../../components/Hero.jsx'
import Question from '../../components/Questtion.jsx'
import Appointment from '../../components/Appointment.jsx'
import Footer from '../../components/Footer.jsx'

const Home = () => {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Navbar stays at the top */}
      <Navbar />

      {/* This 'main' container ensures content starts 
         AFTER the fixed/sticky navbar space.
      */}
      <main className="relative pt-4 md:pt-8">
        <Hero />
        <Question />
        <Appointment />
      </main>

      <Footer />
    </div>
  )
}

export default Home;