import React, { useEffect, useState } from 'react';
import './DashboardPages.css';

const Settings = () => {
    const [health, setHealth] = useState(null);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await fetch('http://localhost:8000/health');
                const data = await res.json();
                setHealth(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchHealth();
    }, []);

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Platform Settings</h2>
                <p>System health, API integrations, and Network parameters.</p>
            </header>

            <div className="glass-card">
                <h3>System Health</h3>
                {health ? (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>API Status</label>
                            <div style={{ color: health.status === 'ok' ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{health.status.toUpperCase()}</div>
                        </div>
                        <div>
                            <label style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>HeLa Connection</label>
                            <div style={{ color: '#fff' }}>{health.hela_connected ? 'Connected (WSS)' : 'Disconnected'}</div>
                        </div>
                        <div>
                            <label style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Chain ID</label>
                            <div style={{ color: '#a855f7' }}>{health.chain_id || '666888'}</div>
                        </div>
                        <div>
                            <label style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Agent Smart Contract</label>
                            <div style={{ color: '#fff', wordBreak: 'break-all' }}>{health.contract_address}</div>
                        </div>
                    </div>
                ) : (
                    <p style={{ color: '#a0a0a0' }}>Pinging backend services...</p>
                )}
            </div>
            
            <div className="glass-card">
                <h3>Integrations</h3>
                <p style={{ color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '1rem' }}>Configure API keys for Agentic protocol extensions.</p>
                <div className="form-group">
                    <label>Google Gemini API Key</label>
                    <input type="password" value="****************************************" disabled />
                </div>
                <div className="form-group">
                    <label>WalletConnect Project ID</label>
                    <input type="password" value="********************************" disabled />
                </div>
            </div>
        </div>
    );
};

export default Settings;
