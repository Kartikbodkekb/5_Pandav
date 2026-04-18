import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3Context } from '../../context/Web3Context';
import './DashboardPages.css';

const RiskScoreCell = ({ id }) => {
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        fetch(`http://127.0.0.1:8000/explain/${id}`)
            .then(res => res.json())
            .then(data => {
                if (isMounted) {
                    setScore(data.risk);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) setLoading(false);
            });
        return () => { isMounted = false; };
    }, [id]);

    const getColor = (s) => {
        if (!s) return '#a0a0a0';
        const num = parseInt(s);
        if (num >= 7) return '#ef4444';
        if (num >= 4) return '#f59e0b';
        return '#4ade80';
    };

    if (loading) return <span style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>Loading...</span>;
    return (
        <span style={{ 
            fontWeight: 'bold', 
            color: getColor(score),
            padding: '0.2rem 0.6rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '4px'
        }}>
            {score ? `${score}/10` : 'N/A'}
        </span>
    );
};

const DisputeCenter = () => {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const { address, provider } = useWeb3Context();
    const [governanceRole, setGovernanceRole] = useState(null);

    useEffect(() => {
        const fetchDecisions = async () => {
            try {
                setLoading(true);
                const govRes = await fetch('http://127.0.0.1:8000/governance');
                if (govRes.ok) {
                    const govData = await govRes.json();
                    setGovernanceRole(govData.governanceRole);
                }

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
        if (!provider || !address) return alert("Wallet not connected");
        
        try {
            const res = await fetch(`http://127.0.0.1:8000/challenge/${id}`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ challenger_address: address }) 
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to prep challenge');
            
            // Execute on-chain via ethers.js
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(data.contract_address, data.abi, signer);
            
            const tx = await contract.challengeDecision(id);
            alert("Transaction submitted! Waiting for confirmation...");
            
            await tx.wait();
            alert("Challenge recorded successfully!");
            fetchDecisions(); // Refresh
        } catch (e) {
             console.error("Challenge error:", e);
             alert(`Challenge Failed: ${e.message || 'Transaction rejected'}`);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Dispute Center</h2>
                <p>DAO Guardians can review recent transactions and freeze malicious AI activity within the 24-hour window.</p>
            </header>

            {(!address || !governanceRole || address.toLowerCase() !== governanceRole.toLowerCase()) ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Access Denied</h3>
                    <p>Only the Contract Initiator ({governanceRole ? `${governanceRole.substring(0, 6)}...${governanceRole.slice(-4)}` : 'the Deployer'}) is authorized to view or challenge active decisions.</p>
                </div>
            ) : (
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
                                <td><RiskScoreCell id={c.id} /></td>
                                <td>{c.status_label}</td>
                                <td>
                                    <button onClick={() => handleChallenge(c.id)} className="primary-btn" style={{padding: '0.4rem 1rem', fontSize: '0.8rem', background: '#3f3f46'}}>Challenge via HeLa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
        </div>
    );
};

export default DisputeCenter;
