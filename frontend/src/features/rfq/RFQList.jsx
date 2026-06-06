// RFQ List page

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { rfqApi } from "../../api/rfqs";
import { usePolling } from "../../hooks/usePolling";
import "./RFQ.css";

export default function RFQList() {
  const [statusFilter, setStatusFilter] = useState("");

  const fetchRfqs = useCallback(
    () => rfqApi.getAll(statusFilter ? { status: statusFilter } : {}),
    [statusFilter]
  );
  const { data, loading, error, refetch } = usePolling(fetchRfqs, 10000);
  const rfqs = data?.data || [];

  const statuses = ["", "DRAFT", "PUBLISHED", "CLOSED", "AWARDED"];

  return (
    <div className="rfq-page">
      <div className="page-header">
        <div>
          <h1>Requests for Quotation</h1>
          <p className="page-subtitle">Manage procurement requests</p>
        </div>
        <Link to="/rfqs/create" className="btn btn-primary">
          + Create RFQ
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="filter-tabs">
        {statuses.map((s) => (
          <button
            key={s}
            className={`filter-tab ${statusFilter === s ? "filter-tab--active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner">Loading RFQs...</div>
      ) : error ? (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button className="btn btn-ghost" onClick={refetch}>Retry</button>
        </div>
      ) : rfqs.length === 0 ? (
        <div className="empty-state">
          <p>No RFQs found.</p>
          <Link to="/rfqs/create" className="btn btn-primary">Create your first RFQ</Link>
        </div>
      ) : (
        <div className="rfq-cards">
          {rfqs.map((rfq) => (
            <div key={rfq.id} className="rfq-card">
              <div className="rfq-card-header">
                <h3>{rfq.title}</h3>
                <span className={`badge badge-${rfq.status.toLowerCase()}`}>
                  {rfq.status}
                </span>
              </div>
              {rfq.description && (
                <p className="rfq-desc">{rfq.description}</p>
              )}
              <div className="rfq-meta">
                <div className="meta-item">
                  <span className="meta-label">Budget</span>
                  <span className="meta-value">
                    {rfq.budget ? `$${rfq.budget.toLocaleString()}` : "Not set"}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Vendors</span>
                  <span className="meta-value">{rfq.rfqVendors?.length || 0}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Quotes</span>
                  <span className="meta-value">{rfq._count?.quotations || 0}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Deadline</span>
                  <span className="meta-value">
                    {rfq.deadline
                      ? new Date(rfq.deadline).toLocaleDateString()
                      : "None"}
                  </span>
                </div>
              </div>
              <div className="rfq-card-footer">
                <span className="td-secondary">
                  By {rfq.createdBy?.name || "Unknown"} · {new Date(rfq.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
