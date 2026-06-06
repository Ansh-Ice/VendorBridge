import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { poApi } from "../../api/purchaseOrders";
import { invoiceApi } from "../../api/invoices";
import { useAuth } from "../../hooks/useAuth";
import { usePolling } from "../../hooks/usePolling";
import {
  FileCheck,
  ArrowLeft,
  Printer,
  AlertCircle
} from "lucide-react";
import "./PO.css";

export default function PODetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoicing, setInvoicing] = useState(false);

  const fetchPO = useCallback(() => poApi.getById(id), [id]);
  const { data, loading, error, refetch } = usePolling(fetchPO, 10000);
  const po = data?.data;

  const handleGenerateInvoice = async () => {
    if (!window.confirm("Do you want to generate a digital GST Invoice for this Purchase Order? This will finalize billing details and set PO to completed.")) return;
    setInvoicing(true);
    try {
      const res = await invoiceApi.generate(po.id);
      alert("GST Invoice generated successfully!");
      navigate(`/invoices/${res.data.id}`);
    } catch (err) {
      alert(err.message || "Failed to generate invoice");
    } finally {
      setInvoicing(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!window.confirm(`Are you sure you want to transition PO status to ${status}?`)) return;
    try {
      await poApi.updateStatus(id, status);
      refetch();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !po) {
    return (
      <div className="page-container" style={{ justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="loading-spinner">Loading PO particulars...</div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="page-container">
        <button className="btn-vb btn-vb-secondary" onClick={() => navigate("/purchase-orders")} style={{ alignSelf: "flex-start" }}>
          <ArrowLeft size={16} /> Back to POs
        </button>
        <div className="card-panel" style={{ textAlign: "center", padding: "40px" }}>
          <AlertCircle size={48} className="text-coral" style={{ marginBottom: "16px" }} />
          <h2>Error Loading Purchase Order</h2>
          <p style={{ color: "var(--vb-text-muted)", marginTop: "8px" }}>{error || "PO record missing."}</p>
        </div>
      </div>
    );
  }

  const isProcurement = user?.role === "ADMIN" || user?.role === "PROCUREMENT_OFFICER";
  const isVendor = user?.role === "VENDOR";

  // Check if invoiced
  const hasInvoice = po.invoices && po.invoices.length > 0;
  const associatedInvoice = hasInvoice ? po.invoices[0] : null;

  return (
    <div className="page-container po-detail-container">
      {/* Screen action header */}
      <div className="screen-header no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
            <FileCheck size={28} className="text-teal" />
            Purchase Order Detail
          </h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px" }}>
            Review sequential order parameters, print document, or generate vendor billing invoice.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-vb btn-vb-secondary" onClick={() => navigate("/purchase-orders")}>
            <ArrowLeft size={16} /> Back to POs
          </button>
          
          <button className="btn-vb btn-vb-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print PO
          </button>

          {po.status !== "COMPLETED" && po.status !== "CANCELLED" && (
            <>
              {isProcurement && (
                <button className="btn-vb btn-vb-danger" onClick={() => handleStatusChange("CANCELLED")}>
                  Cancel PO
                </button>
              )}

              {isVendor && !hasInvoice && (
                <button className="btn-vb btn-vb-primary" onClick={handleGenerateInvoice} disabled={invoicing}>
                  {invoicing ? "Generating Invoice..." : "Generate GST Invoice"}
                </button>
              )}
            </>
          )}

          {hasInvoice && (
            <button className="btn-vb btn-vb-secondary" onClick={() => navigate(`/invoices/${associatedInvoice.id}`)}>
              View Linked Invoice
            </button>
          )}
        </div>
      </div>

      {/* Document layout */}
      <div className="po-layout-grid">
        {/* Left column: A4 Document Preview */}
        <div className="po-document-sheet-wrap">
          <div className="po-document-sheet">
            {/* Header info */}
            <div className="po-sheet-header">
              <div>
                <h2 className="po-sheet-brand">VendorBridge 🌉</h2>
                <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px", lineHeight: "1.4" }}>
                  <strong>VendorBridge ERP Ltd</strong><br />
                  Unit 402, BKC Tech Park, Bandra East<br />
                  Mumbai, Maharashtra - 400051<br />
                  GSTIN: 27AAAAA1111A1Z1
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <h1 className="po-sheet-title">PURCHASE ORDER</h1>
                <div className="mono" style={{ fontSize: "15px", fontWeight: "750", color: "#0f172a", marginTop: "4px" }}>
                  {po.poNumber}
                </div>
                <div style={{ fontSize: "11px", color: "#475569", marginTop: "8px", lineHeight: "1.4" }}>
                  <strong>PO Date:</strong> {new Date(po.issueDate).toLocaleDateString()}<br />
                  <strong>Expected Delivery:</strong> {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : "Immediate"}<br />
                  <strong>Status:</strong> {po.status}
                </div>
              </div>
            </div>

            {/* Address split */}
            <div className="po-sheet-addresses">
              <div>
                <h3 className="po-address-label">ISSUED TO (VENDOR)</h3>
                <div className="po-address-block">
                  <strong>{po.vendor?.name}</strong><br />
                  {po.vendor?.addressLine1} {po.vendor?.addressLine2}<br />
                  {po.vendor?.city}, {po.vendor?.state} - {po.vendor?.postalCode}<br />
                  GSTIN: {po.vendor?.gstin || "Not provided"}<br />
                  Email: {po.vendor?.email}
                </div>
              </div>
              <div>
                <h3 className="po-address-label">DELIVER TO (CUSTOMER)</h3>
                <div className="po-address-block">
                  <strong>VendorBridge Operations</strong><br />
                  Unit 402, BKC Tech Park, Bandra East<br />
                  Mumbai, Maharashtra - 400051<br />
                  GSTIN: 27AAAAA1111A1Z1<br />
                  Phone: +91 22 5555 0199
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="po-sheet-table-wrap">
              <table className="po-sheet-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th>Unit</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Tax Rate</th>
                    <th style={{ textAlign: "right" }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {po.lineItems?.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>
                        <strong>{item.name}</strong>
                        {item.description && (
                          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>{item.description}</div>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }} className="mono">{item.quantity}</td>
                      <td>{item.unit}</td>
                      <td style={{ textAlign: "right" }} className="mono">₹{item.unitPrice.toLocaleString()}</td>
                      <td style={{ textAlign: "right" }} className="mono">{item.taxRate}%</td>
                      <td style={{ textAlign: "right" }} className="mono">₹{item.lineTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals panel */}
            <div className="po-sheet-totals">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "260px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#475569" }}>Subtotal</span>
                  <span className="mono" style={{ fontWeight: "600", color: "#0f172a" }}>₹{po.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#475569" }}>Estimated GST Tax</span>
                  <span className="mono" style={{ fontWeight: "600", color: "#0f172a" }}>₹{po.taxAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "750", borderTop: "1px solid #e2e8f0", paddingTop: "8px", marginTop: "4px" }}>
                  <span style={{ color: "#0f172a" }}>Grand Total (INR)</span>
                  <span className="mono" style={{ color: "#0f172a" }}>₹{po.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Signature & terms */}
            <div style={{ marginTop: "40px", borderTop: "1px solid #e2e8f0", paddingTop: "20px", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
              <div>
                <h4 style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>Purchase Terms & Instructions</h4>
                <p style={{ fontSize: "10px", color: "#64748b", lineHeight: "1.5" }}>
                  {po.terms || "Standard payment terms apply (Net 30). Goods must be delivered in accordance with technical specifications. Please cite this PO number on all shipping bills and invoice drafts."}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
                <div style={{ borderBottom: "1px solid #94a3b8", width: "160px", height: "40px" }} />
                <span style={{ fontSize: "10px", color: "#475569", marginTop: "6px", textTransform: "uppercase" }}>Authorized Officer Signature</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Audit metadata details (no-print) */}
        <div className="po-audit-sidebar no-print" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="card-panel">
            <h3 style={{ fontSize: "14px", color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" }}>
              Purchase Order Lifecycle
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <span style={{ fontSize: "10px", color: "var(--vb-text-muted)" }}>PO STATUS</span>
                <div style={{ marginTop: "4px" }}>
                  <span className={`badge-vb ${
                    po.status === "COMPLETED" ? "badge-vb-lime" :
                    po.status === "CANCELLED" ? "badge-vb-coral" : "badge-vb-cobalt"
                  }`}>{po.status}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "10px", color: "var(--vb-text-muted)" }}>ISSUED BY</span>
                <div style={{ fontWeight: "600", fontSize: "13px", color: "var(--vb-text)" }}>{po.generatedBy?.name}</div>
                <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>{po.generatedBy?.email}</div>
              </div>

              <div>
                <span style={{ fontSize: "10px", color: "var(--vb-text-muted)" }}>REFERENCE RFQ</span>
                <div style={{ fontWeight: "600", fontSize: "13px" }}>{po.rfq?.title}</div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>{po.rfq?.rfqNumber}</div>
              </div>

              {hasInvoice && (
                <div style={{ backgroundColor: "rgba(32, 211, 178, 0.03)", padding: "10px", borderRadius: "8px", border: "1px solid var(--vb-teal)" }}>
                  <span style={{ fontSize: "9px", color: "var(--vb-teal)", fontWeight: "600" }}>LINKED GST INVOICE</span>
                  <div className="mono" style={{ fontWeight: "750", fontSize: "13px", marginTop: "4px" }}>{associatedInvoice.invoiceNumber}</div>
                  <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>Status: {associatedInvoice.status}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
