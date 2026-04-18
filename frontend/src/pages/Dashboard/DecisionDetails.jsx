import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './DashboardPages.css';

const DecisionDetails = () => {
    const { id } = useParams();

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Decision Deep Dive #{id || 'N/A'}</h2>
                <p>Full cryptographic breakdown and AI rationale of the executed agentic intent.</p>
                <div style={{ marginTop: '1rem' }}>
                    <Link to="/dashboard/history" style={{ color: '#a855f7', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Audit Log</Link>
                </div>
            </header>

            <div className="glass-card">
                <h3>Intent Rationale</h3>
                <p style={{ color: '#a0a0a0', lineHeight: '1.6', marginTop: '1rem' }}>
                    Simulation Data: The agent identified a high-value stacking opportunity within the current block window. 
                    Risk parameters remained under the 15% threshold mandated by the DAO.
                </p>
                
                <h3 style={{ marginTop: '2rem' }}>On-Chain Verification</h3>
                <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', wordBreak: 'break-all', fontFamily: 'monospace', color: '#a0a0a0' }}>
                    0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3
                </div>
            </div>
        </div>
    );
};

export default DecisionDetails;
