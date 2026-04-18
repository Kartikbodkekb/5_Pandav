import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPages.css';

const QUICK_TEMPLATES = [
    { action: 'Swap 10 ETH to USDC', reason: 'Market volatility detected — reducing ETH exposure to minimize downside risk.', amount: 10 },
    { action: 'Stake 5 HELA tokens', reason: 'Staking APY at 12.4%, optimal compounding window has been identified.', amount: 5 },
    { action: 'Vote YES on Proposal #44', reason: 'Proposal improves protocol security. AI risk model fully approves.', amount: 0 },
    { action: 'Transfer 2 USDC to treasury', reason: 'Monthly protocol fee collection — scheduled action per DAO charter.', amount: 2 },
];

const AgentSandbox = () => {
    const navigate = useNavigate();
    const [action, setAction] = useState('');
    const [reason, setReason] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleTemplate = (tpl) => {
        setAction(tpl.action);
        setReason(tpl.reason);
        setAmount(String(tpl.amount));
        setResult(null);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResult(null);
        setError(null);
        try {
            const res = await fetch('http://localhost:8000/audit/submit-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason, amount: parseInt(amount) || 0 })
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            setResult(data);
            setAction(''); setReason(''); setAmount('');
        } catch (err) {
            setError(err.message || 'Failed to reach backend.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRiskColor = (score) => {
        if (!score) return '#a0a0a0';
        if (score >= 7) return '#ef4444';
        if (score >= 4) return '#f59e0b';
        return '#4ade80';
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Agent Sandbox</h2>
                <p>
                    Simulate any autonomous agent decision. It will be intercepted, assessed by Gemini AI, and queued for your review in the Command Center.
                </p>
            </header>

            {/* Quick Templates */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ color: '#a0a0a0', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quick Templates
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {QUICK_TEMPLATES.map(tpl => (
                        <button
                            key={tpl.action}
                            onClick={() => handleTemplate(tpl)}
                            style={{
                                padding: '0.4rem 0.9rem',
                                background: 'rgba(168,85,247,0.08)',
                                border: '1px solid rgba(168,85,247,0.25)',
                                borderRadius: '9999px',
                                color: '#d8b4fe',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.target.style.background = 'rgba(168,85,247,0.2)'}
                            onMouseOut={e => e.target.style.background = 'rgba(168,85,247,0.08)'}
                        >
                            {tpl.action}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Form */}
            <div className="glass-card" style={{ maxWidth: '640px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Agent Action</label>
                        <input
                            type="text"
                            placeholder="e.g. Swap 5 ETH to USDC"
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Reasoning / Context</label>
                        <textarea
                            rows="3"
                            placeholder="Explain why the agent wants to execute this action..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label>Financial Value (tokens / amount)</label>
                        <input
                            type="number"
                            placeholder="0"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="primary-btn" disabled={isSubmitting} style={{ width: '100%' }}>
                        {isSubmitting ? 'Intercepting & Evaluating via Gemini...' : 'Submit Agent Intent'}
                    </button>
                </form>

                {/* Success Result */}
                {result && (
                    <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#4ade80', fontWeight: 700 }}>Intent Intercepted</span>
                            <span style={{ padding: '0.2rem 0.75rem', borderRadius: '9999px', background: `${getRiskColor(result.risk_score)}20`, color: getRiskColor(result.risk_score), border: `1px solid ${getRiskColor(result.risk_score)}40`, fontSize: '0.85rem', fontWeight: 600 }}>
                                Risk: {result.risk_score}/10
                            </span>
                        </div>
                        <p style={{ color: '#a0a0a0', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 1rem 0' }}>
                            {result.explanation}
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="primary-btn"
                            style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem' }}
                        >
                            Review in Command Center →
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#f87171', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentSandbox;
