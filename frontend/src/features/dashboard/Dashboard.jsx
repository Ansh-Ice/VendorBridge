// Dashboard page — overview with key metrics

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import "./Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState({
    vendors: 0,
    rfqs: 0,
    quotations: 0,
  });
  const [recentRfqs, setRecentRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [vendorRes, rfqRes, quotationRes] = await Promise.all([
          api.get("/vendors"),
          api.get("/rfqs"),
          api.get("/quotations"),
        ]);

        setStats({
          vendors: vendorRes.count || 0,
          rfqs: rfqRes.count || 0,
          quotations: quotationRes.count || 0,
        });

        setRecentRfqs((rfqRes.data || []).slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  const statCards = [
    { label: "Active Vendors", value: stats.vendors, icon: "🏢", color: "#3b82f6", to: "/vendors" },
    { label: "Open RFQs", value: stats.rfqs, icon: "📋", color: "#8b5cf6", to: "/rfqs" },
    { label: "Quotations", value: stats.quotations, icon: "💰", color: "#10b981", to: "/quotations" },
    { label: "Pending Approvals", value: 0, icon: "✅", color: "#f59e0b", to: "#" },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome back. Here's your procurement overview.</p>
        </div>
        <Link to="/rfqs/create" className="btn btn-primary">
          + New RFQ
        </Link>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <Link to={card.to} key={card.label} className="stat-card" style={{ "--accent": card.color }}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-body">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-section">
        <h2>Recent RFQs</h2>
        {recentRfqs.length === 0 ? (
          <div className="empty-state">
            <p>No RFQs yet. Create your first one!</p>
            <Link to="/rfqs/create" className="btn btn-primary">Create RFQ</Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Vendors</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentRfqs.map((rfq) => (
                  <tr key={rfq.id}>
                    <td className="td-title">{rfq.title}</td>
                    <td>
                      <span className={`badge badge-${rfq.status.toLowerCase()}`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td>{rfq.budget ? `$${rfq.budget.toLocaleString()}` : "—"}</td>
                    <td>{rfq.rfqVendors?.length || 0}</td>
                    <td className="td-date">{new Date(rfq.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
