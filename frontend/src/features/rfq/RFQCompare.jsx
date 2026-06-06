import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { rfqApi } from "../../api/rfqs";
import { quotationApi } from "../../api/quotations";
import { approvalApi } from "../../api/approvals";
import { useAuth } from "../../hooks/useAuth";
import { usePolling } from "../../hooks/usePolling";
import {
  ArrowLeft,
  Check,
  Star,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Award
} from "lucide-react";
import "./RFQ.css";

export default function RFQCompare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submittingId, setSubmittingId] = useState(null);

  const fetchRfq = useCallback(() => rfqApi.getById(id), [id]);
  const { data, loading, error } = usePolling(fetchRfq, 10000);
  const rfq = data?.data;

  const handleAcceptQuote = async (quote) => {
    const quoteId = quote.id;
    const isApprovalRequired = quote.grandTotal > 50000;

    if (isApprovalRequired) {
      if (!window.confirm(`This quotation total is ₹${quote.grandTotal.toLocaleString()} which exceeds the ₹50,000 threshold. It will be routed for sequential manager approvals. Do you want to submit it?`)) return;
      setSubmittingId(quoteId);
      try {
        await approvalApi.create({ rfqId: id, quotationId: quoteId });
        alert("Sequential approval request initiated successfully!");
        navigate(`/rfqs/${id}`);
      } catch (err) {
        alert(err.message || "Failed to submit for approval");
      } finally {
        setSubmittingId(null);
      }
    } else {
      if (!window.confirm("Are you sure you want to ACCEPT this quotation directly?")) return;
      setSubmittingId(quoteId);
      try {
        await quotationApi.updateStatus(quoteId, "ACCEPTED");
        alert("Quotation accepted directly!");
        navigate(`/rfqs/${id}`);
      } catch (err) {
        alert(err.message || "Failed to accept quotation");
      } finally {
        setSubmittingId(null);
      }
    }
  };

  if (loading && !rfq) {
    return (
      <div className="page-container" style={{ justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="loading-spinner">Analyzing quotation matrix...</div>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="page-container">
        <button className="btn-vb btn-vb-secondary" onClick={() => navigate(`/rfqs/${id}`)}>
          <ArrowLeft size={16} /> Back to RFQ
        </button>
        <div className="card-panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <AlertCircle size={48} className="text-coral" style={{ marginBottom: "16px" }} />
          <h2>Comparison Matrix Error</h2>
          <p style={{ color: "var(--vb-text-muted)", marginTop: "8px" }}>{error || "RFQ not found"}</p>
        </div>
      </div>
    );
  }

  const quotes = rfq.quotations || [];
  const lineItems = rfq.lineItems || [];

  // Find lowest price quote as recommendation
  const sortedQuotes = [...quotes].sort((a, b) => a.grandTotal - b.grandTotal);
  const lowestQuoteId = sortedQuotes[0]?.id;

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
            <FileSpreadsheet size={28} className="text-teal" />
            Quotation Comparison Matrix
          </h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px" }}>
            Review vendor bid particulars, delivery terms, tax structures, and ratings side by side.
          </p>
        </div>
        <button className="btn-vb btn-vb-secondary" onClick={() => navigate(`/rfqs/${id}`)}>
          <ArrowLeft size={16} /> Back to RFQ
        </button>
      </div>

      {quotes.length === 0 ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "40px" }}>
          <h2>No Quotes Submitted</h2>
          <p style={{ color: "var(--vb-text-muted)", margin: "8px 0 20px" }}>No vendor bids have been submitted yet for this RFQ.</p>
          <button className="btn-vb btn-vb-secondary" onClick={() => navigate(`/rfqs/${id}`)}>Back to RFQ Details</button>
        </div>
      ) : (
        <div className="card-panel" style={{ padding: "0", overflow: "hidden" }}>
          <div className="table-panel-vb" style={{ border: "none", borderRadius: "0" }}>
            <table className="table-vb" style={{ tableLayout: "fixed", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "300px", minWidth: "250px", position: "sticky", left: "0", backgroundColor: "var(--vb-ink-850)", zIndex: "12" }}>
                    Item Particulars
                  </th>
                  {quotes.map((q) => (
                    <th key={q.id} style={{ minWidth: "240px", textAlign: "right" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                        {q.id === lowestQuoteId && (
                          <span className="badge-vb badge-vb-teal" style={{ fontSize: "9px", padding: "2px 6px", display: "inline-flex", gap: "4px", marginBottom: "4px" }}>
                            <Award size={10} /> BEST BID (LOWEST)
                          </span>
                        )}
                        <span className="mono" style={{ fontSize: "10px", color: "var(--vb-text-muted)" }}>{q.quoteNumber}</span>
                        <div style={{ fontWeight: "750", color: "var(--vb-text)", fontSize: "14px" }}>{q.vendor?.name}</div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "11px", color: "var(--vb-text-subtle)", fontWeight: "500" }}>
                          <Star size={11} className="text-amber" style={{ fill: "var(--vb-amber)" }} />
                          <span>{q.vendor?.rating?.toFixed(1) || "New"}</span>
                          <span>·</span>
                          <span>GSTIN: {q.vendor?.gstin ? "Registered" : "None"}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 1. Item Rows */}
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ position: "sticky", left: "0", backgroundColor: "var(--vb-ink-900)", zIndex: "5", borderRight: "1px solid var(--vb-border-soft)" }}>
                      <div style={{ fontWeight: "600" }}>{item.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>
                        Required: {item.quantity} {item.unit}
                      </div>
                    </td>
                    {quotes.map((q) => {
                      const quoteLine = q.lineItems?.find((li) => li.rfqLineItemId === item.id);
                      return (
                        <td key={q.id} style={{ textAlign: "right" }}>
                          {quoteLine ? (
                            <div>
                              <div className="mono" style={{ fontWeight: "650" }}>
                                ₹{quoteLine.unitPrice.toLocaleString()} / {item.unit}
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>
                                Sub: ₹{quoteLine.lineSubtotal.toLocaleString()} (+{quoteLine.taxRate}% GST)
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "var(--vb-text-subtle)" }}>Not Quoted</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* 2. Total Summary Section */}
                <tr style={{ borderTop: "2px solid var(--vb-border)" }}>
                  <td style={{ fontWeight: "750", position: "sticky", left: "0", backgroundColor: "var(--vb-ink-900)", borderRight: "1px solid var(--vb-border-soft)" }}>
                    Bid Subtotal
                  </td>
                  {quotes.map((q) => (
                    <td key={q.id} className="mono" style={{ textAlign: "right", fontWeight: "600" }}>
                      ₹{q.subtotal.toLocaleString()}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ fontWeight: "500", color: "var(--vb-text-muted)", position: "sticky", left: "0", backgroundColor: "var(--vb-ink-900)", borderRight: "1px solid var(--vb-border-soft)" }}>
                    Estimated Tax (GST)
                  </td>
                  {quotes.map((q) => (
                    <td key={q.id} className="mono" style={{ textAlign: "right", color: "var(--vb-text-muted)" }}>
                      ₹{q.taxAmount.toLocaleString()}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ fontWeight: "500", color: "var(--vb-text-muted)", position: "sticky", left: "0", backgroundColor: "var(--vb-ink-900)", borderRight: "1px solid var(--vb-border-soft)" }}>
                    Freight & Shipping
                  </td>
                  {quotes.map((q) => (
                    <td key={q.id} className="mono" style={{ textAlign: "right", color: "var(--vb-text-muted)" }}>
                      ₹{q.shippingAmount.toLocaleString()}
                    </td>
                  ))}
                </tr>

                <tr style={{ backgroundColor: "rgba(32, 211, 178, 0.03)" }}>
                  <td style={{ fontWeight: "750", color: "var(--vb-teal)", position: "sticky", left: "0", backgroundColor: "var(--vb-ink-900)", borderRight: "1px solid var(--vb-border-soft)" }}>
                    Grand Bid Total
                  </td>
                  {quotes.map((q) => (
                    <td key={q.id} className="mono" style={{ textAlign: "right", fontSize: "16px", fontWeight: "750", color: "var(--vb-teal)" }}>
                      ₹{q.grandTotal.toLocaleString()}
                    </td>
                  ))}
                </tr>

                {/* 3. Vendor Commitments */}
                <tr>
                  <td style={{ fontWeight: "650", position: "sticky", left: "0", backgroundColor: "var(--vb-ink-900)", borderRight: "1px solid var(--vb-border-soft)" }}>
                    Delivery Promise
                  </td>
                  {quotes.map((q) => (
                    <td key={q.id} style={{ textAlign: "right" }}>
                      <span style={{ display: "inline-flex", gap: "6px", alignItems: "center", fontWeight: "600" }}>
                        <Clock size={12} className="text-teal" />
                        {q.deliveryDays} Days
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ fontWeight: "650", position: "sticky", left: "0", backgroundColor: "var(--vb-ink-900)", borderRight: "1px solid var(--vb-border-soft)" }}>
                    Payment Terms
                  </td>
                  {quotes.map((q) => (
                    <td key={q.id} style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "12px", color: "var(--vb-text-muted)" }}>{q.paymentTerms || "Default"}</span>
                    </td>
                  ))}
                </tr>

                {/* 4. Action Row */}
                <tr style={{ backgroundColor: "var(--vb-ink-950)" }}>
                  <td style={{ position: "sticky", left: "0", backgroundColor: "var(--vb-ink-900)", borderRight: "1px solid var(--vb-border-soft)" }}>
                    {/* empty */}
                  </td>
                  {quotes.map((q) => (
                    <td key={q.id} style={{ textAlign: "right", padding: "16px 20px" }}>
                      {q.status === "ACCEPTED" ? (
                        <div className="badge-vb badge-vb-lime" style={{ display: "inline-flex", gap: "4px" }}>
                          <Check size={12} /> Accepted & Awarded
                        </div>
                      ) : q.status === "REJECTED" ? (
                        <span className="badge-vb badge-vb-subtle">Rejected Bids</span>
                      ) : (
                        user?.role !== "VENDOR" && (
                          <button
                            className={`btn-vb ${q.id === lowestQuoteId ? "btn-vb-primary" : "btn-vb-secondary"}`}
                            style={{ padding: "8px 16px", fontSize: "12px" }}
                            disabled={submittingId !== null}
                            onClick={() => handleAcceptQuote(q)}
                          >
                            {submittingId === q.id ? "Accepting..." : "Accept Quotation"}
                          </button>
                        )
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
