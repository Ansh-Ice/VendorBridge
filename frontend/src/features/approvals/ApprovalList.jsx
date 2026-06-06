import { useState, useCallback } from "react";
import { approvalApi } from "../../api/approvals";
import { useAuth } from "../../hooks/useAuth";
import { usePolling } from "../../hooks/usePolling";
import {
  CheckSquare,
  Check,
  X,
  MessageSquare,
  CheckCircle
} from "lucide-react";
import "./Approvals.css";

export default function ApprovalList() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("PENDING");
  const [remarks, setRemarks] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const fetchApprovals = useCallback(
    () => approvalApi.getAll({ status: filter }),
    [filter]
  );
  
  const { data, loading, error, refetch } = usePolling(fetchApprovals, 8000);
  const approvals = data?.data || [];

  const handleDecision = async (id, status) => {
    const stepRemarks = remarks[id] || "";
    if (status === "REJECTED" && !stepRemarks.trim()) {
      alert("Please provide remarks/reason for rejection.");
      return;
    }

    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this procurement request?`)) return;

    setSubmittingId(id);
    try {
      await approvalApi.decide(id, { status, remarks: stepRemarks });
      alert(`Request has been ${status.toLowerCase()}d successfully.`);
      setRemarks(prev => ({ ...prev, [id]: "" }));
      refetch();
    } catch (err) {
      alert(err.message || "Failed to submit decision");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRemarkChange = (id, val) => {
    setRemarks((prev) => ({ ...prev, [id]: val }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING": return "badge-vb-amber";
      case "APPROVED": return "badge-vb-lime";
      case "REJECTED": return "badge-vb-coral";
      default: return "badge-vb-subtle";
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
            <CheckSquare size={28} className="text-teal" />
            Approvals Queue
          </h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px" }}>
            Review, comment, and decide on outstanding procurement bids and cost threshold approvals.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-tabs" style={{ display: "flex", gap: "8px", margin: "16px 0 24px" }}>
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            className={`filter-tab ${filter === s ? "filter-tab--active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s} REQUESTS
          </button>
        ))}
      </div>

      {loading && approvals.length === 0 ? (
        <div className="loading-spinner">Loading approvals queue...</div>
      ) : error ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "30px" }}>
          <p style={{ color: "var(--vb-coral)", marginBottom: "16px" }}>⚠️ {error}</p>
          <button className="btn-vb btn-vb-secondary" onClick={refetch}>Retry Connection</button>
        </div>
      ) : approvals.length === 0 ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "48px 20px" }}>
          <CheckCircle className="text-teal" size={40} style={{ marginBottom: "12px", opacity: 0.7 }} />
          <p style={{ color: "var(--vb-text-muted)" }}>No {filter.toLowerCase()} approval requests in your queue.</p>
        </div>
      ) : (
        <div className="approval-list" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {approvals.map((req) => {
            // Check if current user is the active pending approver
            // It must be their turn (all previous steps approved)
            const activeStepIndex = req.steps?.findIndex(s => s.status === "PENDING");
            const isUserTurn = activeStepIndex !== -1 && 
              req.steps[activeStepIndex]?.approverId === user.id &&
              req.steps.slice(0, activeStepIndex).every(s => s.status === "APPROVED");

            return (
              <div key={req.id} className="card-panel" style={{ borderLeft: isUserTurn ? "4px solid var(--vb-teal)" : "1px solid var(--vb-border)" }}>
                {/* Upper summary */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <span className="mono" style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>RFQ LINK: {req.rfq?.rfqNumber}</span>
                    <h3 style={{ fontSize: "18px", marginTop: "4px" }}>{req.rfq?.title}</h3>
                    <p style={{ fontSize: "12px", color: "var(--vb-text-muted)", marginTop: "4px" }}>
                      Requested by {req.requestedBy?.name} on {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge-vb ${getStatusBadge(req.status)}`} style={{ marginBottom: "6px" }}>
                      {req.status}
                    </span>
                    <div className="mono" style={{ fontSize: "18px", fontWeight: "750", color: "var(--vb-teal)" }}>
                      ₹{req.quotation?.grandTotal?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Left/Right Split Panel */}
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", borderTop: "1px solid var(--vb-border-soft)", paddingTop: "16px" }}>
                  {/* Left Side: Bid line particulars */}
                  <div>
                    <h4 style={{ fontSize: "13px", color: "var(--vb-text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>
                      Quoted Items from {req.quotation?.vendor?.name}
                    </h4>
                    <div className="table-panel-vb">
                      <table className="table-vb">
                        <thead>
                          <tr>
                            <th>Item Name</th>
                            <th>Qty</th>
                            <th style={{ textAlign: "right" }}>Price</th>
                            <th style={{ textAlign: "right" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {req.quotation?.lineItems?.map((li) => (
                            <tr key={li.id}>
                              <td>{li.rfqLineItem?.name}</td>
                              <td>{li.quantity}</td>
                              <td style={{ textAlign: "right" }} className="mono">₹{li.unitPrice.toLocaleString()}</td>
                              <td style={{ textAlign: "right" }} className="mono">₹{li.lineTotal.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Side: Approval Routing Workflow */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <h4 style={{ fontSize: "13px", color: "var(--vb-text-muted)", textTransform: "uppercase", marginBottom: "12px" }}>
                        Sequential Approvals Path
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {req.steps?.map((step) => (
                          <div key={step.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", backgroundColor: "var(--vb-ink-950)", borderRadius: "8px", border: "1px solid var(--vb-border-soft)" }}>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: "600" }}>
                                L{step.sequence}: {step.approver?.name}
                              </div>
                              {step.remarks && (
                                <div style={{ fontSize: "11px", color: "var(--vb-text-muted)", marginTop: "2px", display: "flex", gap: "4px", alignItems: "center" }}>
                                  <MessageSquare size={10} /> "{step.remarks}"
                                </div>
                              )}
                            </div>
                            <span className={`badge-vb ${
                              step.status === "APPROVED" ? "badge-vb-lime" :
                              step.status === "REJECTED" ? "badge-vb-coral" : "badge-vb-subtle"
                            }`} style={{ fontSize: "10px" }}>
                              {step.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action form if it's user's turn */}
                    {isUserTurn && filter === "PENDING" && (
                      <div style={{ borderTop: "1px solid var(--vb-border-soft)", paddingTop: "14px", marginTop: "auto" }}>
                        <div className="form-group-vb">
                          <label>Approval/Rejection Remarks *</label>
                          <textarea
                            className="textarea-vb"
                            placeholder="Input rationale for decision..."
                            rows={2}
                            value={remarks[req.id] || ""}
                            onChange={(e) => handleRemarkChange(req.id, e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            className="btn-vb btn-vb-danger"
                            style={{ flex: 1 }}
                            disabled={submittingId !== null}
                            onClick={() => handleDecision(req.id, "REJECTED")}
                          >
                            <X size={14} /> Reject Bid
                          </button>
                          <button
                            className="btn-vb btn-vb-primary"
                            style={{ flex: 1 }}
                            disabled={submittingId !== null}
                            onClick={() => handleDecision(req.id, "APPROVED")}
                          >
                            <Check size={14} /> Approve Bid
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
