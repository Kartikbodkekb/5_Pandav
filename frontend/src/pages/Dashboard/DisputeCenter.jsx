import React, { useState, useEffect } from 'react';
import './DashboardPages.css';

const DisputeCenter = () => {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDecisions = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/decisions');
                const data = await res.json();
                if (data && data.decisions) {
                    const pending = data.decisions.filter(d => d.status === 0);
                    setChallenges(pending);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDecisions();
    }, []);

    const handleChallenge = async (id) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/challenge/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challenger_address: '0xWeb3Address' }) });
            const data = await res.json();
            alert(`Ready to challenge! Contract: ${data.contract_address}, Function: ${data.function}`);
        } catch (e) {
            alert('Failed to challenge');
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Dispute Center</h2>
                <p>DAO Guardians can review recent transactions and freeze malicious AI activity within the 24-hour window.</p>
            </header>

            <div className="glass-card">
                <h3>Active Challenge Windows</h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Action</th>
                            <th>Risk Score</th>
                            <th>Time Remaining</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5">Loading pending decisions...</td></tr>
                        ) : challenges.length === 0 ? (
                            <tr><td colSpan="5">No pending decisions.</td></tr>
                        ) : challenges.map(c => (
                            <tr key={c.id}>
                                <td>#{c.id}</td>
                                <td>{c.action}</td>
                                <td style={{color: '#a0a0a0', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{c.explanation_hash || "No explanation"}</td>
                                <td>{c.status_label}</td>
                                <td>
                                    <button onClick={() => handleChallenge(c.id)} className="primary-btn" style={{padding: '0.4rem 1rem', fontSize: '0.8rem', background: '#3f3f46'}}>Challenge via HeLa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DisputeCenter;
