import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { auth } from '../../../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useWeb3Modal, useWeb3ModalAccount, useDisconnect } from '@web3modal/ethers/react'
import './Navbar.css'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Architecture', href: '#architecture' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState(null)
  
  // Web3Modal Hooks
  const { open } = useWeb3Modal()
  const { address, isConnected } = useWeb3ModalAccount()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser)
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (isConnected) disconnect();
    } catch (err) {
      console.error("Logout error", err);
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Set initial state based on current scroll position
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="navbar">
      <div className="navbar__inner container">
        <a href="#" className="navbar__logo">
          <div className="navbar__logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" rx="4" stroke="#6366f1" strokeWidth="2" fill="none" opacity="0.6" />
              <rect x="6" y="6" width="16" height="16" rx="2" stroke="#818cf8" strokeWidth="1.5" fill="none" opacity="0.4" />
              <circle cx="14" cy="14" r="3" fill="#6366f1" />
            </svg>
          </div>
          <span className="navbar__logo-text">TAAP</span>
        </a>

        <div className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="navbar__link"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          
          {user && (
            <Link
              to="/dashboard"
              className="navbar__link"
              onClick={() => setMobileOpen(false)}
              style={{ color: '#818cf8', fontWeight: 'bold' }}
            >
              Dashboard
            </Link>
          )}

          {/* Centered Connect Wallet Button for Authenticated Users */}
          {user && !isConnected && (
            <button className="navbar__link" onClick={() => open()} style={{ border: '1px solid #6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', color: '#818cf8', fontWeight: 'bold' }}>
              Connect Wallet
            </button>
          )}
          {user && isConnected && (
            <button className="navbar__link" onClick={() => open()} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid #6366f1', borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', color: '#818cf8', fontWeight: 'bold' }}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </button>
          )}
        </div>

        {/* Extreme Right CTA */}
        {!user ? (
          <Link to="/login" className="navbar__cta">
            Login
          </Link>
        ) : (
          <button className="navbar__cta" onClick={handleLogout} style={{ border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontFamily: 'inherit' }}>
            Logout
          </button>
        )}

        <button
          className={`navbar__hamburger ${mobileOpen ? 'navbar__hamburger--open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          id="nav-toggle"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  )
}
