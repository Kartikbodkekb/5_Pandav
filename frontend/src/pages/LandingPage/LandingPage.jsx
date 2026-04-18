import Navbar from './Navbar'
import Hero from './Hero'
import Features from './Features'
import HowItWorks from './HowItWorks'
import Architecture from './Architecture'
import Footer from './Footer'
import DotNav from './DotNav'
import ParticleField from './ParticleField'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <ParticleField />
      
      <div className="content-layer">
        <Navbar />
        <Hero />
        <Features />
        <HowItWorks />
        <Architecture />
        <Footer />
        <DotNav />
      </div>
    </div>
  )
}
