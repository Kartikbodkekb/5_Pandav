import React, { useState, useEffect } from 'react';
import { Search, Flame } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { useToast } from '../../components/Toast';
import { useWeb3ModalAccount } from '@web3modal/ethers/react';
import './DashboardPages.css';

const DisputeCenter = () => {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const toast = useToast();
    const { address } = useWeb3ModalAccount();

    useEffect(() => {
        const fetchDecisions = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/decisions');
                const data = await res.json();
                if (data && data.decisions) {
                    setDecisions(data.decisions);
                }
            } catch (err) {
                toast.error("Failed to load decisions", err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDecisions();
    }, [toast]);

    const handleChallenge = async (id) => {
        if (!address) {
            toast.warning("Wallet Required", "Please connect your wallet to challenge an intent.");
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/challenge/${id}`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ challenger_address: address }) 
            });
            const data = await res.json();
            toast.success("Ready to Challenge", `Contract: ${data.contract_address.slice(0,10)}... Function: ${data.function}`);
        } catch (e) {
            toast.error("Failed to initiate challenge", e.message);
        }
    };

    const truncateAddress = (addr) => {
        if (addr === null || addr === undefined) return '';
        const str = String(addr);
        if (str.length <= 10) return str;
        return `${str.slice(0, 6)}...${str.slice(-4)}`;
    };

    const getStatusStyles = (status) => {
        // Mock status from numerical ID for UI demonstration
        if (status === 1) return { class: 'status-executed', label: 'Executed' };
        if (status === 0) return { class: 'status-timelocked', label: 'Timelocked' };
        return { class: 'status-disputed', label: 'Disputed' };
    };

    const filteredDecisions = decisions.filter(d => {
        if (filter === 'All') return true;
        const statusStr = getStatusStyles(d.status).label;
        return statusStr === filter;
    });

    return (
        <div className="page-container">
            <PageHeader
                eyebrow="DAO Challenge Hub"
                title="Dispute Center"
                description="Guardians can review recent transactions and freeze malicious AI activity within the 24-hour timelock window."
            />

            <div className="filter-bar glass">
                <div className="filter-pills">
                    {['All', 'Timelocked', 'Executed', 'Disputed'].map(f => (
                        <button
                            key={f}
                            className={`filter-pill ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={16} />
                    <input type="text" placeholder="Search by intent ID or agent..." className="search-input" />
                </div>
            </div>

            <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table-v2">
                        <thead>
                            <tr>
                                <th>Intent ID</th>
                                <th>Action</th>
                                <th>Agent</th>
                                <th>Value</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>Loading network decisions...</td></tr>
                            ) : filteredDecisions.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No decisions found matching filter.</td></tr>
                            ) : filteredDecisions.map(d => {
                                const statusInfo = getStatusStyles(d.status);
                                return (
                                    <tr key={d.id}>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>#{String(d.id).slice(0, 6)}</td>
                                        <td>
                                            <span style={{ 
                                                display: 'inline-block', padding: '4px 8px', borderRadius: '4px', 
                                                background: 'rgba(255,255,255,0.05)', fontSize: '12px' 
                                            }}>
                                                {d.action}
                                            </span>
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>{truncateAddress(d.agent_address || "0xAgent...")}</td>
                                        <td style={{ fontWeight: 500 }}>{d.amount}</td>
                                        <td>
                                            <span className={`status-badge ${statusInfo.class}`}>
                                                <span className="dot" />
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {statusInfo.label === 'Timelocked' && (
                                                <button 
                                                    className="destructive-btn"
                                                    onClick={() => handleChallenge(d.id)}
                                                >
                                                    <Flame size={14} />
                                                    Challenge via HeLa
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DisputeCenter;
