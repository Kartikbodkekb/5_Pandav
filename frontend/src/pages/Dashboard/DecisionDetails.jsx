import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './DashboardPages.css';

const DecisionDetails = () => {
    const { id } = useParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDeepDive = async () => {
            try {
                setError(null);
                // Calls GET /explain/{id} which fetches the decision AND generates AI explanation
                const res = await fetch(`http://localhost:8000/explain/${id}`);
                if (!res.ok) throw new Error(`Decision #${id} not found on chain.`);
                const data = await res.json();
                setDetails(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDeepDive();
    }, [id]);

    const getRiskColor = (score) => {
        if (!score) return '#a0a0a0';
        if (score >= 7) return '#ef4444';
        if (score >= 4) return '#f59e0b';
        return '#4ade80';
    };

    const decision = details?.decision;

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Decision Deep Dive #{id}</h2>
                <p>Full AI rationale and on-chain data for this executed agentic intent.</p>
                <div style={{ marginTop: '0.75rem' }}>
                    <Link to="/dashboard/history" style={{ color: '#a855f7', textDecoration: 'none', fontSize: '0.9rem' }}>
                        ← Back to Audit Log
                    </Link>
                </div>
            </header>

            {loading ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#a0a0a0' }}>
                    <p>Fetching from HeLa Smart Contract and running AI analysis...</p>
                </div>
            ) : error ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
                    <p>{error}</p>
                </div>
            ) : (
                <>
                {/* Summary Stats Row */}
                <div className="stats-grid">
                    {[
                        { label: 'Action', value: decision?.action },
                        { label: 'Amount', value: decision?.amount ?? 'N/A' },
                        { label: 'Status', value: decision?.status_label || 'Executed' },
                        { label: 'Risk Score', value: details?.risk ? `${details.risk}/10` : 'N/A', color: getRiskColor(parseInt(details?.risk)) },
                    ].map(item => (
                        <div key={item.label} className="glass-card" style={{ textAlign: 'center' }}>
                            <div style={{ color: '#a0a0a0', fontSize: '0.78rem', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                            <div style={{ fontWeight: 700, color: item.color || '#fff', fontSize: '1rem', wordBreak: 'break-word' }}>{item.value}</div>
                        </div>
                    ))}
                </div>

                    {/* AI Explanation */}
                    <div className="glass-card">
                        <h3>AI Auditor Explanation</h3>
                        <p style={{ color: '#c4c4c4', lineHeight: '1.7', marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
                            {details?.explanation || 'No explanation generated.'}
                        </p>
                        {details?.summary && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(168,85,247,0.08)', borderLeft: '3px solid #a855f7', borderRadius: '4px', color: '#d8b4fe', fontSize: '0.9rem' }}>
                                {details.summary}
                            </div>
                        )}
                        {details?.should_challenge && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', borderLeft: '3px solid #ef4444', borderRadius: '4px', color: '#fca5a5', fontSize: '0.9rem' }}>
                                AI recommends challenging this decision.
                            </div>
                        )}
                    </div>

                    {/* Agent Reason */}
                    <div className="glass-card">
                        <h3>Agent's Stated Reason</h3>
                        <p style={{ color: '#a0a0a0', marginTop: '1rem', fontStyle: 'italic', lineHeight: '1.6' }}>
                            "{decision?.reason || 'No reason provided.'}"
                        </p>
                    </div>

                    {/* On-chain data */}
                    <div className="glass-card">
                        <h3>On-Chain Record</h3>
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { label: 'Agent Address', value: decision?.agent },
                                { label: 'Timestamp', value: decision?.timestamp ? new Date(decision.timestamp * 1000).toLocaleString() : 'N/A' },
                                { label: 'Explanation Hash', value: decision?.explanation_hash },
                                { label: 'Disputed', value: decision?.disputed ? 'Yes' : 'No' },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>{row.label}</span>
                                    <span style={{ fontFamily: 'monospace', color: '#e2e8f0', fontSize: '0.85rem', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{row.value || '—'}</span>
                                </div>
                            ))}
                        </div>
                        {decision?.explorer_url && (
                            <div style={{ marginTop: '1rem' }}>
                                <a href={decision.explorer_url} target="_blank" rel="noreferrer" className="primary-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                                    View on HeLa Explorer
                                </a>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default DecisionDetails;
