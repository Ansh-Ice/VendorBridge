// Quotations list page

import { useCallback } from "react";
import { quotationApi } from "../../api/quotations";
import { usePolling } from "../../hooks/usePolling";
import "./Quotations.css";

export default function QuotationList() {
  const fetchQuotations = useCallback(() => quotationApi.getAll(), []);
  const { data, loading, error, refetch } = usePolling(fetchQuotations, 10000);
  const quotations = data?.data || [];
  console.log("QuotationList data:", quotations);

  const handleStatusChange = async (id, status) => {
    try {
      await quotationApi.updateStatus(id, status);
      refetch();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="quotations-page">
      <div className="page-header">
        <div>
          <h1>Quotations</h1>
          <p className="page-subtitle">Review vendor submissions</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading quotations...</div>
      ) : error ? (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button className="btn btn-ghost" onClick={refetch}>Retry</button>
        </div>
      ) : quotations.length === 0 ? (
        <div className="empty-state">
          <p>No quotations submitted yet.</p>
        </div>
      ) : (
        <div className="quotation-cards">
          {quotations.map((q) => (
            <div key={q.id} className="quotation-card">
              <div className="quotation-header">
                <div>
                  <h3 className="quotation-amount">
                    ${q.amount?.toLocaleString() ?? q.grandTotal?.toLocaleString() ?? "N/A"}
                  </h3>
                  <span className="td-secondary">by {q.vendor?.name || "Unknown"}</span>
                </div>
                <span className={`badge badge-${q.status.toLowerCase()}`}>
                  {q.status}
                </span>
              </div>
              <div className="quotation-rfq">
                <span className="meta-label">RFQ</span>
                <span className="meta-value">{q.rfq?.title || "N/A"}</span>
              </div>
              {q.notes && <p className="quotation-notes">{q.notes}</p>}
              <div className="quotation-footer">
                <span className="td-date">
                  {new Date(q.submittedAt).toLocaleDateString()}
                </span>
                {q.status === "PENDING" && (
                  <div className="quotation-actions">
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleStatusChange(q.id, "ACCEPTED")}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleStatusChange(q.id, "REJECTED")}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
