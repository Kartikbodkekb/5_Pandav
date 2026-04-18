import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useWeb3Context } from '../context/Web3Context';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { address, isConnected, connect, disconnect } = useWeb3Context();
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (isConnected) disconnect();
      navigate('/');
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>Agentic Protocol</h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="icon">⚡</span>
            Command Center
          </NavLink>
          <NavLink to="/dashboard/history" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="icon">📜</span>
            Audit History
          </NavLink>
          <NavLink to="/dashboard/disputes" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="icon">⚖️</span>
            Dispute Center
          </NavLink>
          <NavLink to="/dashboard/sandbox" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <span className="icon">🧪</span>
            Agent Sandbox
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              ☰
            </button>
            <h1>Dashboard Suite</h1>
          </div>
          <div className="header-right">
             <button
                onClick={isConnected ? () => disconnect() : () => connect()}
                className={`wallet-btn ${isConnected ? 'connected' : ''}`}
            >
                {isConnected ? formatAddress(address) : 'Connect Wallet'}
            </button>
            <button
                onClick={handleLogout}
                style={{ marginLeft: '12px', padding: '0.6rem 1.2rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                Logout
            </button>
          </div>
        </header>

        {/* Content Outlet for nested routes */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
};

export default DashboardLayout;
