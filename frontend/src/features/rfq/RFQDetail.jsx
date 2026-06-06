import { useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { rfqApi } from "../../api/rfqs";
import { useAuth } from "../../hooks/useAuth";
import { usePolling } from "../../hooks/usePolling";
import {
  Calendar,
  Layers,
  Users,
  FileText,
  DollarSign,
  ArrowLeft,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Briefcase
} from "lucide-react";
import "./RFQ.css";

export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("items");

  const fetchRfq = useCallback(() => rfqApi.getById(id), [id]);
  const { data, loading, error, refetch } = usePolling(fetchRfq, 8000);
  const rfq = data?.data;

  // Find if vendor has already quoted
  const vendorQuotation = rfq?.quotations?.find(
    (q) => q.vendorId === user?.vendorId
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "DRAFT": return "badge-vb-subtle";
      case "PUBLISHED": return "badge-vb-cobalt";
      case "QUOTING": return "badge-vb-teal";
      case "CLOSED": return "badge-vb-amber";
      case "AWAITING_APPROVAL": return "badge-vb-amber";
      case "APPROVED": return "badge-vb-lime";
      case "AWARDED": return "badge-vb-teal";
      case "REJECTED": case "CANCELLED": return "badge-vb-coral";
      default: return "badge-vb-subtle";
    }
  };

  const handlePublish = async () => {
    if (!window.confirm("Are you sure you want to publish this RFQ to invited vendors?")) return;
    try {
      await rfqApi.update(id, { status: "PUBLISHED" });
      refetch();
    } catch (err) {
      alert(err.message || "Failed to publish RFQ");
    }
  };

  const handleClose = async () => {
    if (!window.confirm("Are you sure you want to close bidding for this RFQ?")) return;
    try {
      await rfqApi.update(id, { status: "CLOSED" });
      refetch();
    } catch (err) {
      alert(err.message || "Failed to close RFQ");
    }
  };

  if (loading && !rfq) {
    return (
      <div className="page-container" style={{ justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="loading-spinner">Loading RFQ particulars...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <button className="btn-vb btn-vb-secondary" onClick={() => navigate("/rfqs")} style={{ alignSelf: "flex-start" }}>
          <ArrowLeft size={16} /> Back to RFQs
        </button>
        <div className="card-panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <AlertCircle size={48} className="text-coral" style={{ marginBottom: "16px" }} />
          <h2>Error Loading RFQ</h2>
          <p style={{ color: "var(--vb-text-muted)", marginTop: "8px", marginBottom: "24px" }}>{error}</p>
          <button className="btn-vb btn-vb-primary" onClick={refetch}>Retry Connection</button>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="page-container">
        <div className="card-panel" style={{ textAlign: "center", padding: "40px" }}>
          <h2>RFQ Not Found</h2>
          <p style={{ color: "var(--vb-text-muted)", margin: "12px 0 24px" }}>The requested RFQ record is missing or deleted.</p>
          <button className="btn-vb btn-vb-secondary" onClick={() => navigate("/rfqs")}>Back to List</button>
        </div>
      </div>
    );
  }

  const isOwner = user?.role === "ADMIN" || user?.role === "PROCUREMENT_OFFICER";
  const isApprover = user?.role === "APPROVER";
  const isVendor = user?.role === "VENDOR";

  return (
    <div className="page-container">
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <span className="mono" style={{ color: "var(--vb-text-muted)", fontWeight: "500", fontSize: "14px" }}>{rfq.rfqNumber}</span>
            <span className={`badge-vb ${getStatusBadgeClass(rfq.status)}`}>{rfq.status}</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "700" }}>{rfq.title}</h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Created by {rfq.createdBy?.name || "Procurement Team"} · Issued on {new Date(rfq.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-vb btn-vb-secondary" onClick={() => navigate(isVendor ? "/vendor/rfqs" : "/rfqs")}>
            <ArrowLeft size={16} /> Back
          </button>
          
          {isOwner && rfq.status === "DRAFT" && (
            <button className="btn-vb btn-vb-primary" onClick={handlePublish}>
              Publish RFQ
            </button>
          )}

          {isOwner && (rfq.status === "PUBLISHED" || rfq.status === "QUOTING") && (
            <button className="btn-vb btn-vb-danger" onClick={handleClose}>
              Close Bidding
            </button>
          )}

          {isOwner && rfq.status === "CLOSED" && rfq.quotations?.length > 1 && (
            <button className="btn-vb btn-vb-primary" onClick={() => navigate(`/rfqs/${id}/compare`)}>
              <FileSpreadsheet size={16} /> Compare Quotations
            </button>
          )}
        </div>
      </div>

      <div className="grid-two-col">
        {/* Left column: Detail Tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Navigation Tabs */}
          <div className="filter-tabs" style={{ marginBottom: "0", borderBottom: "1px solid var(--vb-border-soft)", paddingBottom: "8px" }}>
            <button
              className={`filter-tab ${activeTab === "items" ? "filter-tab--active" : ""}`}
              onClick={() => setActiveTab("items")}
            >
              <Layers size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              Line Items ({rfq.lineItems?.length || 0})
            </button>

            {isOwner || isApprover ? (
              <button
                className={`filter-tab ${activeTab === "quotes" ? "filter-tab--active" : ""}`}
                onClick={() => setActiveTab("quotes")}
              >
                <FileSpreadsheet size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                Quotations ({rfq.quotations?.length || 0})
              </button>
            ) : (
              <button
                className={`filter-tab ${activeTab === "vendor-quote" ? "filter-tab--active" : ""}`}
                onClick={() => setActiveTab("vendor-quote")}
              >
                <FileSpreadsheet size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                Your Quotation
              </button>
            )}

            <button
              className={`filter-tab ${activeTab === "history" ? "filter-tab--active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <Clock size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              Timeline & Approvals
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="card-panel">
            {activeTab === "items" && (
              <div>
                <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Requisition Line Items</h3>
                <div className="table-panel-vb">
                  <table className="table-vb">
                    <thead>
                      <tr>
                        <th>Item Description</th>
                        <th>Required Qty</th>
                        <th>Unit</th>
                        {isOwner && <th style={{ textAlign: "right" }}>Target Unit Price</th>}
                        {isOwner && <th style={{ textAlign: "right" }}>Target Total</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rfq.lineItems?.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ fontWeight: "600" }}>{item.name}</div>
                            {item.description && (
                              <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>{item.description}</div>
                            )}
                          </td>
                          <td>{item.quantity}</td>
                          <td><span className="badge-vb badge-vb-subtle" style={{ fontSize: "10px", padding: "2px 6px" }}>{item.unit}</span></td>
                          {isOwner && (
                            <td style={{ textAlign: "right" }} className="mono">
                              {item.targetPrice ? `₹${item.targetPrice.toLocaleString()}` : "-"}
                            </td>
                          )}
                          {isOwner && (
                            <td style={{ textAlign: "right" }} className="mono">
                              {item.targetPrice ? `₹${(item.targetPrice * item.quantity).toLocaleString()}` : "-"}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "quotes" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px" }}>Received Quotation Bids</h3>
                  {rfq.quotations?.length > 1 && (
                    <button className="btn-vb btn-vb-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => navigate(`/rfqs/${id}/compare`)}>
                      Compare Matrix
                    </button>
                  )}
                </div>

                {rfq.quotations?.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px", color: "var(--vb-text-muted)" }}>
                    <Briefcase size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                    <p>No vendor bids submitted yet.</p>
                  </div>
                ) : (
                  <div className="table-panel-vb">
                    <table className="table-vb">
                      <thead>
                        <tr>
                          <th>Quote #</th>
                          <th>Vendor</th>
                          <th>Grand Total</th>
                          <th>Delivery Days</th>
                          <th>Status</th>
                          <th style={{ textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rfq.quotations?.map((q) => (
                          <tr key={q.id}>
                            <td className="mono" style={{ fontWeight: "600" }}>{q.quoteNumber}</td>
                            <td>
                              <div style={{ fontWeight: "600" }}>{q.vendor?.name}</div>
                              <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>Score: ★ {q.vendor?.rating?.toFixed(1) || "N/A"}</div>
                            </td>
                            <td className="mono" style={{ fontWeight: "600", color: "var(--vb-teal)" }}>
                              ₹{q.grandTotal.toLocaleString()}
                            </td>
                            <td>{q.deliveryDays} Days</td>
                            <td>
                              <span className={`badge-vb ${
                                q.status === "ACCEPTED" ? "badge-vb-lime" :
                                q.status === "REJECTED" ? "badge-vb-coral" : "badge-vb-cobalt"
                              }`}>{q.status}</span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn-vb btn-vb-secondary"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                                onClick={() => navigate(`/rfqs/${id}/compare`)}
                              >
                                <Eye size={12} /> View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "vendor-quote" && (
              <div>
                <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Your Bid Submission</h3>
                
                {vendorQuotation ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "var(--vb-ink-950)", border: "1px solid var(--vb-border)", borderRadius: "8px", marginBottom: "20px" }}>
                      <div>
                        <div className="mono" style={{ fontSize: "12px", color: "var(--vb-text-muted)" }}>QUOTE NUMBER</div>
                        <div className="mono" style={{ fontSize: "18px", fontWeight: "700", color: "var(--vb-teal)" }}>{vendorQuotation.quoteNumber}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "var(--vb-text-muted)" }}>STATUS</div>
                        <span className={`badge-vb ${vendorQuotation.status === "ACCEPTED" ? "badge-vb-lime" : "badge-vb-cobalt"}`}>
                          {vendorQuotation.status}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "12px", color: "var(--vb-text-muted)" }}>GRAND TOTAL</div>
                        <div className="mono" style={{ fontSize: "18px", fontWeight: "700" }}>₹{vendorQuotation.grandTotal.toLocaleString()}</div>
                      </div>
                    </div>

                    <h4 style={{ fontSize: "14px", marginBottom: "10px" }}>Quoted Line Prices</h4>
                    <div className="table-panel-vb" style={{ marginBottom: "20px" }}>
                      <table className="table-vb">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th style={{ textAlign: "right" }}>Unit Price</th>
                            <th style={{ width: "10%" }}>Tax Rate</th>
                            <th style={{ textAlign: "right" }}>Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendorQuotation.lineItems?.map((li) => (
                            <tr key={li.id}>
                              <td>{li.rfqLineItem?.name}</td>
                              <td>{li.quantity}</td>
                              <td style={{ textAlign: "right" }} className="mono">₹{li.unitPrice.toLocaleString()}</td>
                              <td>{li.taxRate}%</td>
                              <td style={{ textAlign: "right" }} className="mono" style={{ fontWeight: "600" }}>
                                ₹{li.lineTotal.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div className="form-group-vb">
                        <label>Delivery Commitment</label>
                        <input className="input-vb" value={`${vendorQuotation.deliveryDays} Days`} disabled />
                      </div>
                      <div className="form-group-vb">
                        <label>Payment Terms Accepted</label>
                        <input className="input-vb" value={vendorQuotation.paymentTerms || "Default"} disabled />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <FileText size={48} className="text-teal" style={{ marginBottom: "16px", opacity: 0.6 }} />
                    <h4>No Active Bid Submitted</h4>
                    <p style={{ color: "var(--vb-text-muted)", marginTop: "8px", marginBottom: "24px", fontSize: "14px" }}>
                      You have been invited to quote for this procurement request. Submit your bids before the deadline.
                    </p>
                    {rfq.status === "PUBLISHED" || rfq.status === "QUOTING" ? (
                      <Link to={`/rfqs/${id}/quote`} className="btn-vb btn-vb-primary">
                        Submit Quote Bid
                      </Link>
                    ) : (
                      <div className="badge-vb badge-vb-coral">RFQ Bidding is not open (Status: {rfq.status})</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>RFQ Timeline & Actions Log</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div className="badge-vb badge-vb-teal" style={{ padding: "6px", borderRadius: "50%" }} />
                      <div style={{ width: "2px", flexGrow: "1", backgroundColor: "var(--vb-border-soft)", margin: "4px 0" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px" }}>RFQ Created</div>
                      <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>{new Date(rfq.createdAt).toLocaleString()}</div>
                    </div>
                  </div>

                  {rfq.publishedAt && (
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div className="badge-vb badge-vb-cobalt" style={{ padding: "6px", borderRadius: "50%" }} />
                        <div style={{ width: "2px", flexGrow: "1", backgroundColor: "var(--vb-border-soft)", margin: "4px 0" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>RFQ Published (Bidding Open)</div>
                        <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>{new Date(rfq.publishedAt).toLocaleString()}</div>
                      </div>
                    </div>
                  )}

                  {rfq.approvalRequests?.map((req) => (
                    <div key={req.id} style={{ display: "flex", gap: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div className={`badge-vb ${req.status === "APPROVED" ? "badge-vb-lime" : "badge-vb-amber"}`} style={{ padding: "6px", borderRadius: "50%" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>Approval Workflow: {req.status}</div>
                        <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>Requested by {req.requestedBy?.name}</div>
                        {req.steps?.map((step) => (
                          <div key={step.id} style={{ fontSize: "11px", color: "var(--vb-text-muted)", marginLeft: "14px", marginTop: "4px" }}>
                            · Approver: {step.approver?.name} - <strong>{step.status}</strong> {step.remarks ? `(${step.remarks})` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Summary metadata & Invites checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Metadata Cards */}
          <div className="card-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Requisition Summary</h3>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <DollarSign className="text-teal" size={20} />
              <div>
                <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>ESTIMATED BUDGET</div>
                <div className="mono" style={{ fontSize: "15px", fontWeight: "600" }}>
                  {rfq.budget ? `₹${rfq.budget.toLocaleString()}` : "Not Declared"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Calendar className="text-teal" size={20} />
              <div>
                <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>RESPONSE DEADLINE</div>
                <div style={{ fontSize: "15px", fontWeight: "600" }}>
                  {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : "No Deadline"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Users className="text-teal" size={20} />
              <div>
                <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>INVITED VENDORS</div>
                <div style={{ fontSize: "15px", fontWeight: "600" }}>
                  {rfq.rfqVendors?.length || 0} Registered Vendor(s)
                </div>
              </div>
            </div>
          </div>

          {/* Invited Vendors Checklist */}
          <div className="card-panel">
            <h3 style={{ fontSize: "14px", color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" }}>
              Invited Bidder Status
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {rfq.rfqVendors?.length === 0 ? (
                <p style={{ color: "var(--vb-text-muted)", fontSize: "12px" }}>No vendors invited to this RFQ.</p>
              ) : (
                rfq.rfqVendors.map((invite) => (
                  <div key={invite.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", backgroundColor: "var(--vb-ink-950)", borderRadius: "8px", border: "1px solid var(--vb-border-soft)" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600" }}>{invite.vendor?.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>{invite.vendor?.email}</div>
                    </div>
                    <span className={`badge-vb ${
                      invite.status === "QUOTED" ? "badge-vb-teal" : "badge-vb-subtle"
                    }`} style={{ fontSize: "10px", padding: "2px 8px" }}>
                      {invite.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
