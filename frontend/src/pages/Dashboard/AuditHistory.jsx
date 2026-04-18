import React, { useState, useEffect } from 'react';
import './DashboardPages.css';

const AuditHistory = () => {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Future integration: fetch from GET /decisions
                // const res = await fetch('http://localhost:8000/decisions');
                // const data = await res.json();
                // setDecisions(data.decisions);
                
                // MOCK DATA FOR PROTOTYPE
                setDecisions([
                    { id: 1, action: "swap ETH to USDC", amount: 500, status_label: "Executed", txHash: "0xdaa68666..." },
                    { id: 2, action: "stake 10 HELA tokens", amount: 10, status_label: "Executed", txHash: "0xf4e051df..." }
                ]);
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
                                        <a href={`https://testnet-scan.helachain.com/tx/${d.txHash}`} target="_blank" rel="noreferrer" style={{color: '#a855f7'}}>
                                            {d.txHash}
                                        </a>
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
