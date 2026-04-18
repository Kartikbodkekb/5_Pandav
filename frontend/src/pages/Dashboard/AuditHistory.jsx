import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPages.css';

const AuditHistory = () => {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalDecisions, setTotalDecisions] = useState(0);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setError(null);
                const res = await fetch('http://localhost:8000/decisions');
                if (!res.ok) throw new Error(`API error: ${res.status}`);
                const data = await res.json();
                setDecisions(data.decisions || []);
                setTotalDecisions(data.total || 0);
            } catch (err) {
                console.error('Failed to fetch audit history:', err);
                setError('Could not reach backend. Make sure uvicorn is running.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getRiskColor = (score) => {
        if (!score) return '#a0a0a0';
        if (score >= 7) return '#ef4444';
        if (score >= 4) return '#f59e0b';
        return '#4ade80';
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Audit History</h2>
                <p>
                    Immutable log of every action executed by the Agentic Protocol on the HeLa Blockchain.
                    {totalDecisions > 0 && <span style={{ marginLeft: '1rem', color: '#a855f7', fontWeight: 600 }}>{totalDecisions} total decisions logged</span>}
                </p>
            </header>

            <div className="glass-card">
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a0a0' }}>
                        <p>Querying HeLa Smart Contract...</p>
                    </div>
                ) : error ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>
                        <p>{error}</p>
                    </div>
                ) : decisions.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#a0a0a0' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</p>
                        <p>No decisions logged on-chain yet.</p>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Run <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>python mock_agent.py</code> to submit transactions.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Action</th>
                                <th>Agent</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Transaction</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {decisions.map(d => (
                                <tr key={d.id}>
                                    <td style={{ color: '#a0a0a0' }}>#{d.id}</td>
                                    <td style={{ maxWidth: '200px' }}>{d.action}</td>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', color: '#a0a0a0', fontSize: '0.8rem' }}>
                                            {d.agent ? `${d.agent.slice(0, 6)}...${d.agent.slice(-4)}` : 'N/A'}
                                        </span>
                                    </td>
                                    <td>{d.amount}</td>
                                    <td>
                                        <span className={`status-badge ${d.disputed ? 'disputed' : 'executed'}`}>
                                            {d.disputed ? 'Disputed' : d.status_label || 'Executed'}
                                        </span>
                                    </td>
                                    <td>
                                        {d.explorer_url ? (
                                            <a href={d.explorer_url} target="_blank" rel="noreferrer" style={{ color: '#a855f7', fontSize: '0.85rem' }}>
                                                View on HeLa
                                            </a>
                                        ) : (
                                            <span style={{ color: '#555' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        <Link to={`/dashboard/history/${d.id}`} style={{ color: '#818cf8', fontSize: '0.85rem', textDecoration: 'none' }}>
                                            Explain →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AuditHistory;
