import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './DashboardPages.css';

const DecisionDetails = () => {
    const { id } = useParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeepDive = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/explain/${id}`);
                const data = await res.json();
                setDetails(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDeepDive();
    }, [id]);

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
                <h3>Intent Rationale (AI Explainer)</h3>
                <p style={{ color: '#a0a0a0', lineHeight: '1.6', marginTop: '1rem' }}>
                    {loading ? "Generating explanation..." : details?.explanation || "Explanation unavailable."}
                </p>
                
                <h3 style={{ marginTop: '2rem' }}>On-Chain Verification</h3>
                <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', wordBreak: 'break-all', fontFamily: 'monospace', color: '#a0a0a0' }}>
                    {loading ? "Loading..." : details?.decision?.explanation_hash || "No hash available"}
                </div>
            </div>
        </div>
    );
};

export default DecisionDetails;
