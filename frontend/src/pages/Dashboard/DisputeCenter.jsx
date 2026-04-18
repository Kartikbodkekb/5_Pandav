import React from 'react';
import './DashboardPages.css';

const DisputeCenter = () => {
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
                        <tr>
                            <td>#3</td>
                            <td>vote YES on Proposal #42</td>
                            <td style={{color: '#4ade80'}}>1/10</td>
                            <td>23h 45m</td>
                            <td>
                                <button className="primary-btn" style={{padding: '0.4rem 1rem', fontSize: '0.8rem', background: '#3f3f46'}}>Challenge via HeLa</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DisputeCenter;
