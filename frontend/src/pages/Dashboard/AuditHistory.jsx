import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3Context } from '../../context/Web3Context';
import './DashboardPages.css';

const AuditHistory = () => {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);

    const { address } = useWeb3Context();
    const [governanceRole, setGovernanceRole] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const govRes = await fetch('http://127.0.0.1:8000/governance');
                if (govRes.ok) {
                    const govData = await govRes.json();
                    setGovernanceRole(govData.governanceRole);
                }

                const res = await fetch('http://127.0.0.1:8000/decisions');
                const data = await res.json();
                if (data && data.decisions) {
                    setDecisions(data.decisions);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Audit History</h2>
                <p>Immutable log of every action executed by the Agentic Protocol on the HeLa Blockchain.</p>
            </header>

            {(!address || !governanceRole || address.toLowerCase() !== governanceRole.toLowerCase()) ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Access Denied</h3>
                    <p>Only the Contract Initiator ({governanceRole ? `${governanceRole.substring(0, 6)}...${governanceRole.slice(-4)}` : 'the Deployer'}) is authorized to view this restricted audit log.</p>
                </div>
            ) : (
                <div className="glass-card">
                    {loading ? (
                    <p>Loading chain data...</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Action</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Transaction</th>
                            </tr>
                        </thead>
                        <tbody>
                            {decisions.map(d => (
                                <tr key={d.id}>
                                    <td>#{d.id}</td>
                                    <td>{d.action}</td>
                                    <td>{d.amount}</td>
                                    <td><span className="status-badge executed">{d.status_label}</span></td>
                                    <td>
                                        <Link to={`/dashboard/history/${d.id}`} className="primary-btn" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: '#3f3f46', textDecoration: 'none' }}>
                                            Explain
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            )}
        </div>
    );
};

export default AuditHistory;
