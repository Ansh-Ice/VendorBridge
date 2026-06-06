// RFQ List page

import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { rfqApi } from "../../api/rfqs";
import { usePolling } from "../../hooks/usePolling";
import { useAuth } from "../../hooks/useAuth";
import { Calendar, DollarSign, FileText, ArrowRight } from "lucide-react";
import "./RFQ.css";

export default function RFQList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");

  const fetchRfqs = useCallback(
    () => rfqApi.getAll(statusFilter ? { status: statusFilter } : {}),
    [statusFilter]
  );
  
  const { data, loading, error, refetch } = usePolling(fetchRfqs, 10000);
  const rfqs = data?.data || [];

  const statuses = ["", "DRAFT", "PUBLISHED", "QUOTING", "CLOSED", "APPROVED", "AWARDED"];

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "DRAFT": return "badge-vb-subtle";
      case "PUBLISHED": return "badge-vb-cobalt";
      case "QUOTING": return "badge-vb-teal";
      case "CLOSED": return "badge-vb-amber";
      case "APPROVED": return "badge-vb-lime";
      case "AWARDED": return "badge-vb-teal";
      case "REJECTED": case "CANCELLED": return "badge-vb-coral";
      default: return "badge-vb-subtle";
    }
  };

  const isProcurement = user?.role === "ADMIN" || user?.role === "PROCUREMENT_OFFICER";

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
            <FileText size={28} className="text-teal" />
            Requests for Quotation
          </h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px" }}>
            {user?.role === "VENDOR"
              ? "View and submit quotation bids for invited procurement requests."
              : "Create, publish, and evaluate procurement Requests for Quotation."}
          </p>
        </div>
        
        {isProcurement && (
          <Link to="/rfqs/create" className="btn-vb btn-vb-primary">
            + Create RFQ
          </Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="filter-tabs" style={{ display: "flex", gap: "8px", margin: "16px 0 24px", flexWrap: "wrap" }}>
        {statuses.map((s) => (
          <button
            key={s}
            className={`filter-tab ${statusFilter === s ? "filter-tab--active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s || "All RFQs"}
          </button>
        ))}
      </div>

      {loading && rfqs.length === 0 ? (
        <div className="loading-spinner">Loading Requests for Quotation...</div>
      ) : error ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "30px" }}>
          <p style={{ color: "var(--vb-coral)", marginBottom: "16px" }}>⚠️ {error}</p>
          <button className="btn-vb btn-vb-secondary" onClick={refetch}>Retry Connection</button>
        </div>
      ) : rfqs.length === 0 ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "48px 20px" }}>
          <p style={{ color: "var(--vb-text-muted)", marginBottom: "16px" }}>No RFQs found in this queue.</p>
          {isProcurement && (
            <Link to="/rfqs/create" className="btn-vb btn-vb-primary">Create your first RFQ</Link>
          )}
        </div>
      ) : (
        <div className="rfq-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "18px" }}>
          {rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="rfq-card card-panel"
              style={{ display: "flex", flexDirection: "column", gap: "14px", cursor: "pointer" }}
              onClick={() => navigate(`/rfqs/${rfq.id}`)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div>
                  <span className="mono" style={{ fontSize: "11px", color: "var(--vb-text-muted)", display: "block", marginBottom: "2px" }}>
                    {rfq.rfqNumber}
                  </span>
                  <h3 style={{ fontSize: "16px", fontWeight: "650" }}>{rfq.title}</h3>
                </div>
                <span className={`badge-vb ${getStatusBadgeClass(rfq.status)}`} style={{ fontSize: "10px" }}>
                  {rfq.status}
                </span>
              </div>
              
              {rfq.description && (
                <p style={{
                  color: "var(--vb-text-muted)",
                  fontSize: "13px",
                  lineHeight: "1.4",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: "2",
                  WebkitBoxOrient: "vertical",
                  minHeight: "36px"
                }}>
                  {rfq.description}
                </p>
              )}

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                borderTop: "1px solid var(--vb-border-soft)",
                paddingTop: "12px",
                marginTop: "auto"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <DollarSign size={14} className="text-teal" />
                  <div>
                    <span style={{ fontSize: "9px", color: "var(--vb-text-muted)", display: "block" }}>BUDGET</span>
                    <span className="mono" style={{ fontSize: "12px", fontWeight: "600" }}>
                      {rfq.budget ? `₹${rfq.budget.toLocaleString()}` : "Not Set"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={14} className="text-teal" />
                  <div>
                    <span style={{ fontSize: "9px", color: "var(--vb-text-muted)", display: "block" }}>DEADLINE</span>
                    <span style={{ fontSize: "12px", fontWeight: "600" }}>
                      {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : "None"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--vb-border-soft)",
                paddingTop: "12px",
                fontSize: "11px",
                color: "var(--vb-text-subtle)"
              }}>
                <span>Invited: {rfq.rfqVendors?.length || 0}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--vb-teal)", fontWeight: "600" }}>
                  View details <ArrowRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
