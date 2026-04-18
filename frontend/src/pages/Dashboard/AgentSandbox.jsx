import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPages.css';

const STATUS_CONFIG = {
    auto_executed:    { label: 'Auto-Executed',    color: '#4ade80', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'   },
    pending_review:   { label: 'Needs Review',     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    execution_failed: { label: 'Failed',           color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)'  },
};

const getRiskColor = (score) => {
    if (score >= 7) return '#ef4444';
    if (score >= 5) return '#f59e0b';
    return '#4ade80';
};

const AgentSandbox = () => {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [reputations, setReputations] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const fetchReputation = () => {
        fetch('http://localhost:8000/reputation')
            .then(r => r.json())
            .then(data => setReputations(data.leaderboard || []))
            .catch(console.error);
    };

    // Load agent profiles on mount
    useEffect(() => {
        fetch('http://localhost:8000/agents/profiles')
            .then(r => r.json())
            .then(data => setProfiles(data.agents || []))
            .catch(console.error);
            
        fetchReputation();
    }, []);

    const handleRunAgents = async () => {
        setIsRunning(true);
        setResults(null);
        setError(null);
        try {
            const res = await fetch('http://localhost:8000/agents/run', { method: 'POST' });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setResults(data);
            fetchReputation(); // Refresh reputation after runs
        } catch (err) {
            setError(err.message);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Agent Sandbox</h2>
                <p>
                    Trigger all 4 autonomous AI agents simultaneously. Low-risk decisions are executed
                    on the HeLa blockchain automatically. High-risk decisions appear in the Command Center for your review.
                </p>
            </header>

            {/* Agent Profiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {profiles.map(agent => (
                    <div key={agent.name} className="glass-card" style={{ margin: 0, padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>
                                {agent.name === 'Alpha-Trader' ? '📈' :
                                 agent.name === 'DAO-Governor' ? '🏛️' :
                                 agent.name === 'Yield-Seeker' ? '💰' : '🛡️'}
                            </span>
                            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{agent.name}</strong>
                        </div>
                        <p style={{ color: '#a0a0a0', fontSize: '0.82rem', margin: '0 0 0.5rem 0', lineHeight: '1.4' }}>
                            {agent.description}
                        </p>
                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{agent.decision_count} possible decisions</span>
                        {/* Inline Reputation UI */}
                        {reputations.find(r => r.name === agent.name) && (
                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#a0a0a0', fontSize: '0.78rem' }}>On-Chain Reputation</span>
                                <span style={{ 
                                    fontWeight: 'bold', 
                                    color: reputations.find(r => r.name === agent.name).reputation >= 100 ? '#4ade80' : 
                                           reputations.find(r => r.name === agent.name).reputation >= 50 ? '#f59e0b' : '#ef4444' 
                                }}>
                                    {reputations.find(r => r.name === agent.name).reputation} pts
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Threshold Banner */}
            <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.2)' }}>
                <span style={{ fontSize: '1.5rem' }}>⚡</span>
                <div>
                    <div style={{ color: '#d8b4fe', fontWeight: 600, fontSize: '0.9rem' }}>Auto-Execution Rule</div>
                    <div style={{ color: '#a0a0a0', fontSize: '0.85rem' }}>
                        Risk Score <strong style={{ color: '#4ade80' }}>1–5</strong> → Executed on HeLa Blockchain automatically
                        &nbsp;|&nbsp;
                        Risk Score <strong style={{ color: '#f59e0b' }}>6–10</strong> → Queued for human review in Command Center
                    </div>
                </div>
            </div>

            {/* Run Button */}
            <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <button
                    onClick={handleRunAgents}
                    disabled={isRunning}
                    className="primary-btn"
                    style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', opacity: isRunning ? 0.7 : 1 }}
                >
                    {isRunning ? '🤖 Agents thinking & executing...' : '🚀 Run All 4 Agents Now'}
                </button>
                {isRunning && (
                    <p style={{ color: '#a0a0a0', marginTop: '1rem', fontSize: '0.9rem' }}>
                        Each agent is picking a decision, calling Gemini for risk assessment, and executing or queueing...
                    </p>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="glass-card" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                    {error}
                </div>
            )}

            {/* Results */}
            {results && (
                <>
                    {/* Summary Bar */}
                    <div className="stats-grid">
                        {[
                            { label: 'Agents Run', value: results.agents_run, color: '#fff' },
                            { label: 'Auto-Executed', value: results.auto_executed, color: '#4ade80' },
                            { label: 'Needs Review', value: results.pending_review, color: '#f59e0b' },
                            { label: 'Risk Threshold', value: `≤ ${results.threshold}`, color: '#a855f7' },
                        ].map(s => (
                            <div key={s.label} className="glass-card" style={{ textAlign: 'center' }}>
                                <div style={{ color: '#a0a0a0', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{s.label}</div>
                                <div style={{ fontWeight: 700, fontSize: '1.5rem', color: s.color }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Per-Agent Results */}
                    {results.results.map(r => {
                        const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.execution_failed;
                        return (
                            <div key={r.agent} className="glass-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '0.25rem' }}>{r.agent}</div>
                                        <div style={{ color: '#a0a0a0', fontSize: '0.85rem' }}>{r.action}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.82rem',
                                            fontWeight: 600, color: getRiskColor(r.risk_score),
                                            background: `${getRiskColor(r.risk_score)}15`,
                                            border: `1px solid ${getRiskColor(r.risk_score)}30`
                                        }}>
                                            Risk: {r.risk_score}/10
                                        </span>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.82rem',
                                            fontWeight: 600, color: statusCfg.color,
                                            background: statusCfg.bg, border: `1px solid ${statusCfg.border}`
                                        }}>
                                            {statusCfg.label}
                                        </span>
                                    </div>
                                </div>

                                <p style={{ color: '#a0a0a0', fontSize: '0.85rem', fontStyle: 'italic', margin: '0 0 0.75rem 0' }}>
                                    "{r.reason}"
                                </p>

                                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                                    {r.explanation}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>{r.message}</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {r.tx_hash && (
                                            <a href={r.explorer_url} target="_blank" rel="noreferrer"
                                               style={{ color: '#a855f7', fontSize: '0.82rem', textDecoration: 'none', padding: '0.3rem 0.8rem', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '6px' }}>
                                                View on HeLa →
                                            </a>
                                        )}
                                        {r.status === 'pending_review' && (
                                            <button onClick={() => navigate('/dashboard')}
                                                    style={{ color: '#f59e0b', fontSize: '0.82rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>
                                                Review in Command Center →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
};

export default AgentSandbox;
