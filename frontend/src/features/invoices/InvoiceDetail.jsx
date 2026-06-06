import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invoiceApi } from "../../api/invoices";
import { useAuth } from "../../hooks/useAuth";
import { usePolling } from "../../hooks/usePolling";
import {
  Receipt,
  ArrowLeft,
  Printer,
  AlertCircle
} from "lucide-react";
import "../purchase-orders/PO.css"; // Reuse document layouts
import "./Invoice.css";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const fetchInvoice = useCallback(() => invoiceApi.getById(id), [id]);
  const { data, loading, error, refetch } = usePolling(fetchInvoice, 10000);
  const invoice = data?.data;

  const handleMarkPaid = async () => {
    if (!window.confirm("Are you sure you want to mark this invoice as PAID? This action is audited and irreversible.")) return;
    setUpdating(true);
    try {
      await invoiceApi.updateStatus(id, "PAID");
      alert("Invoice marked as PAID!");
      refetch();
    } catch (err) {
      alert(err.message || "Failed to update invoice");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !invoice) {
    return (
      <div className="page-container" style={{ justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="loading-spinner">Loading GST invoice particulars...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="page-container">
        <button className="btn-vb btn-vb-secondary" onClick={() => navigate("/invoices")} style={{ alignSelf: "flex-start" }}>
          <ArrowLeft size={16} /> Back to Invoices
        </button>
        <div className="card-panel" style={{ textAlign: "center", padding: "40px" }}>
          <AlertCircle size={48} className="text-coral" style={{ marginBottom: "16px" }} />
          <h2>Error Loading Invoice</h2>
          <p style={{ color: "var(--vb-text-muted)", marginTop: "8px" }}>{error || "Invoice record missing."}</p>
        </div>
      </div>
    );
  }

  const isProcurement = user?.role === "ADMIN" || user?.role === "PROCUREMENT_OFFICER";

  // Check if same state (CGST+SGST) or different state (IGST)
  const isSameState = invoice.cgst > 0 || invoice.sgst > 0;

  return (
    <div className="page-container invoice-detail-container">
      {/* Screen action header */}
      <div className="screen-header no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Receipt size={28} className="text-teal" />
            Tax Invoice particulars
          </h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px" }}>
            Review dynamic Indian GST tax allocations, ledger reconciliation, and payment logs.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-vb btn-vb-secondary" onClick={() => navigate("/invoices")}>
            <ArrowLeft size={16} /> Back to Invoices
          </button>
          
          <button className="btn-vb btn-vb-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print Invoice
          </button>

          {invoice.status !== "PAID" && isProcurement && (
            <button className="btn-vb btn-vb-primary" onClick={handleMarkPaid} disabled={updating}>
              {updating ? "Reconciling..." : "Reconcile & Mark PAID"}
            </button>
          )}

          {invoice.purchaseOrderId && (
            <button className="btn-vb btn-vb-secondary" onClick={() => navigate(`/purchase-orders/${invoice.purchaseOrderId}`)}>
              View Linked PO
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
                <h2 className="po-sheet-brand">{invoice.vendor?.name}</h2>
                <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px", lineHeight: "1.4" }}>
                  <strong>{invoice.vendor?.legalName || invoice.vendor?.name}</strong><br />
                  {invoice.vendor?.addressLine1} {invoice.vendor?.addressLine2}<br />
                  {invoice.vendor?.city}, {invoice.vendor?.state} - {invoice.vendor?.postalCode}<br />
                  GSTIN: {invoice.vendor?.gstin || "N/A"}<br />
                  State Code: {invoice.vendor?.stateCode || "N/A"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <h1 className="po-sheet-title" style={{ color: "#0f172a" }}>TAX INVOICE</h1>
                <div className="mono" style={{ fontSize: "15px", fontWeight: "750", color: "#0f172a", marginTop: "4px" }}>
                  {invoice.invoiceNumber}
                </div>
                <div style={{ fontSize: "11px", color: "#475569", marginTop: "8px", lineHeight: "1.4" }}>
                  <strong>Invoice Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString()}<br />
                  <strong>Payment Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}<br />
                  <strong>Ref PO Number:</strong> {invoice.purchaseOrder?.poNumber || "N/A"}<br />
                  <strong>Status:</strong> {invoice.status}
                </div>
              </div>
            </div>

            {/* Address split */}
            <div className="po-sheet-addresses">
              <div>
                <h3 className="po-address-label">BILL TO (CUSTOMER)</h3>
                <div className="po-address-block">
                  <strong>{invoice.organization?.legalName || invoice.organization?.name}</strong><br />
                  {invoice.organization?.billingAddress || "Unit 402, BKC Tech Park, Bandra East, Mumbai"}<br />
                  State Code: {invoice.organization?.stateCode || "MH"}<br />
                  GSTIN: {invoice.organization?.gstin || "27AAAAA1111A1Z1"}<br />
                  Currency: {invoice.organization?.currency || "INR"}
                </div>
              </div>
              <div>
                <h3 className="po-address-label">SUPPLIER DISPATCH</h3>
                <div className="po-address-block">
                  <strong>{invoice.vendor?.name}</strong><br />
                  {invoice.vendor?.city}, {invoice.vendor?.state} - {invoice.vendor?.postalCode}<br />
                  Email: {invoice.vendor?.email}<br />
                  Phone: {invoice.vendor?.phone || "N/A"}<br />
                  State Code: {invoice.vendor?.stateCode || "N/A"}
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
                  {invoice.lineItems?.map((item, idx) => (
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

            {/* GST Split & Totals panel */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "16px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              {/* GST allocation audit */}
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "11px", color: "#475569", width: "320px", lineHeight: "1.5" }}>
                <h4 style={{ fontSize: "11px", fontWeight: "750", color: "#0f172a", textTransform: "uppercase", marginBottom: "6px" }}>
                  Indian GST Audit Allocation
                </h4>
                {isSameState ? (
                  <div>
                    Same-State Transaction (CGST + SGST split applies):<br />
                    · <strong>CGST Component:</strong> ₹{invoice.cgst.toLocaleString()}<br />
                    · <strong>SGST Component:</strong> ₹{invoice.sgst.toLocaleString()}
                  </div>
                ) : (
                  <div>
                    Inter-State Transaction (IGST applies):<br />
                    · <strong>IGST Component:</strong> ₹{invoice.igst.toLocaleString()}
                  </div>
                )}
                <div style={{ marginTop: "6px", fontSize: "10px", color: "#64748b", borderTop: "1px dashed #cbd5e1", paddingTop: "4px" }}>
                  Determined by customer state ({invoice.organization?.stateCode || "MH"}) and vendor state ({invoice.vendor?.stateCode || "MH"}).
                </div>
              </div>

              {/* Invoice Totals */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "240px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#475569" }}>Taxable Subtotal</span>
                  <span className="mono" style={{ fontWeight: "600", color: "#0f172a" }}>₹{invoice.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#475569" }}>Total Tax (GST)</span>
                  <span className="mono" style={{ fontWeight: "600", color: "#0f172a" }}>₹{invoice.taxAmount.toLocaleString()}</span>
                </div>
                {invoice.roundOff !== 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#475569" }}>Round Off</span>
                    <span className="mono" style={{ color: "#475569" }}>{invoice.roundOff > 0 ? "+" : ""}₹{invoice.roundOff.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "750", borderTop: "1px solid #e2e8f0", paddingTop: "8px", marginTop: "4px" }}>
                  <span style={{ color: "#0f172a" }}>Grand Total (INR)</span>
                  <span className="mono" style={{ color: "#0f172a" }}>₹{invoice.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Terms and signature */}
            <div style={{ marginTop: "40px", borderTop: "1px solid #e2e8f0", paddingTop: "20px", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
              <div>
                <h4 style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>Declaration & Bank Wire Details</h4>
                <p style={{ fontSize: "10px", color: "#64748b", lineHeight: "1.5" }}>
                  We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Bank account wire particulars: State Bank of India, BKC Corporate Branch, IFSC: SBIN0001234, Current A/c: 1234567890.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
                <div style={{ borderBottom: "1px solid #94a3b8", width: "160px", height: "40px" }} />
                <span style={{ fontSize: "10px", color: "#475569", marginTop: "6px", textTransform: "uppercase" }}>Authorized Supplier Signature</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Audit sidebar (no-print) */}
        <div className="po-audit-sidebar no-print" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="card-panel">
            <h3 style={{ fontSize: "14px", color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" }}>
              Tax Audit & Ledger
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <span style={{ fontSize: "10px", color: "var(--vb-text-muted)" }}>INVOICE STATUS</span>
                <div style={{ marginTop: "4px" }}>
                  <span className={`badge-vb ${
                    invoice.status === "PAID" ? "badge-vb-lime" : "badge-vb-cobalt"
                  }`}>{invoice.status}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "10px", color: "var(--vb-text-muted)" }}>SUPPLIER VENDOR</span>
                <div style={{ fontWeight: "600", fontSize: "13px" }}>{invoice.vendor?.name}</div>
                <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>GSTIN: {invoice.vendor?.gstin}</div>
              </div>

              <div>
                <span style={{ fontSize: "10px", color: "var(--vb-text-muted)" }}>DELIVERY PO LINK</span>
                <div style={{ fontWeight: "600", fontSize: "13px" }}>
                  PO Number: {invoice.purchaseOrder?.poNumber}
                </div>
                <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>
                  Grand Total: ₹{invoice.purchaseOrder?.grandTotal?.toLocaleString()}
                </div>
              </div>

              <div style={{ backgroundColor: "var(--vb-ink-950)", padding: "12px", borderRadius: "8px", border: "1px solid var(--vb-border-soft)" }}>
                <span style={{ fontSize: "9px", color: "var(--vb-text-muted)", textTransform: "uppercase" }}>AUDIT STAMP</span>
                <div style={{ fontSize: "11px", color: "var(--vb-text-muted)", marginTop: "4px", lineHeight: "1.4" }}>
                  CGST Tax Code: ₹{invoice.cgst.toLocaleString()}<br />
                  SGST Tax Code: ₹{invoice.sgst.toLocaleString()}<br />
                  IGST Tax Code: ₹{invoice.igst.toLocaleString()}<br />
                  Ledger Rounding: ₹{invoice.roundOff.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
