import React, { useState } from 'react';
import './DashboardPages.css';

const AgentSandbox = () => {
    const [action, setAction] = useState('');
    const [reason, setReason] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/agent/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason: "Context provided by sandbox", amount: parseInt(amount) || 0, explanation_hash: reason })
            });
            const data = await res.json();
            if (!res.ok) {
                setResult({ isError: true, detail: data.detail });
            } else {
                setResult(data);
                setAction(''); setReason(''); setAmount('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Agent Sandbox</h2>
                <p>Simulate AI agent decisions and funnel them directly into the Interceptor for risk evaluation.</p>
            </header>

            <div className="glass-card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Action</label>
                        <input 
                            type="text" 
                            placeholder="e.g. transfer 5 USDC to treasury"
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Reasoning Context</label>
                        <textarea 
                            rows="3" 
                            placeholder="Explain the logic behind this action..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label>Financial Value (Amount)</label>
                        <input 
                            type="number" 
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="primary-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Evaluating via Gemini...' : 'Trigger Simulation'}
                    </button>
                </form>

                {result && result.isError && (
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>Transaction Failed</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#a0a0a0' }}>{result.detail?.error || 'Unknown Error'}</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#a0a0a0' }}>{result.detail?.message}</p>
                    </div>
                )}
                
                {result && !result.isError && (
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,255,0,0.05)', border: '1px solid rgba(0,255,0,0.2)', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#4ade80' }}>Success! Intent Logged On-Chain.</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#a0a0a0' }}>Tx Hash: <strong style={{color: '#fff'}}>{result.tx_hash}</strong></p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#a0a0a0' }}>Head to the Audit History to review it.</p>
                        <a href={result.hela_explorer_url} target="_blank" rel="noreferrer" style={{color: '#a855f7', display: 'block', marginTop: '0.5rem'}}>View on HeLa Explorer</a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentSandbox;
