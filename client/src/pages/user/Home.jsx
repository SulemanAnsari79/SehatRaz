import React from 'react'
import Navbar from '../../components/Navbar'
import ProductCard from '../../components/ProductCard'
import Footer from '../../components/Footer'
import Hero from '../../components/Hero'
import Question from '../../components/Questtion'
import Appointment from '../../components/Appointment'

const Home = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <Question />
      <Appointment />
      <Footer />
    </div>
  )
}

export default Home;
