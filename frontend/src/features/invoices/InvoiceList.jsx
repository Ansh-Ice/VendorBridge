import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { invoiceApi } from "../../api/invoices";
import { usePolling } from "../../hooks/usePolling";
import {
  Receipt,
  Eye
} from "lucide-react";

export default function InvoiceList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");

  const fetchInvoices = useCallback(
    () => invoiceApi.getAll(statusFilter ? { status: statusFilter } : {}),
    [statusFilter]
  );
  
  const { data, loading, error, refetch } = usePolling(fetchInvoices, 10000);
  const invoices = data?.data || [];

  const statuses = ["", "GENERATED", "SENT", "PAID", "OVERDUE", "VOID"];

  const getStatusBadge = (status) => {
    switch (status) {
      case "DRAFT": return "badge-vb-subtle";
      case "GENERATED": return "badge-vb-cobalt";
      case "SENT": return "badge-vb-teal";
      case "PAID": return "badge-vb-lime";
      case "OVERDUE": case "VOID": return "badge-vb-coral";
      default: return "badge-vb-subtle";
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Receipt size={28} className="text-teal" />
            GST Invoices
          </h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px" }}>
            Monitor vendor tax invoices, CGST/SGST/IGST breakdowns, payment receipts, and audits.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-tabs" style={{ display: "flex", gap: "8px", margin: "16px 0 24px", flexWrap: "wrap" }}>
        {statuses.map((s) => (
          <button
            key={s}
            className={`filter-tab ${statusFilter === s ? "filter-tab--active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s || "All Invoices"}
          </button>
        ))}
      </div>

      {loading && invoices.length === 0 ? (
        <div className="loading-spinner">Loading tax invoices...</div>
      ) : error ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "30px" }}>
          <p style={{ color: "var(--vb-coral)", marginBottom: "16px" }}>⚠️ {error}</p>
          <button className="btn-vb btn-vb-secondary" onClick={refetch}>Retry Connection</button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "48px 20px" }}>
          <p style={{ color: "var(--vb-text-muted)" }}>No Invoices found in this queue.</p>
        </div>
      ) : (
        <div className="table-panel-vb">
          <table className="table-vb">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>PO Number</th>
                <th>Supplier / Vendor</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="mono" style={{ fontWeight: "750" }}>{inv.invoiceNumber}</td>
                  <td className="mono">{inv.purchaseOrder?.poNumber || "Direct"}</td>
                  <td>
                    <div style={{ fontWeight: "600" }}>{inv.vendor?.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>{inv.vendor?.email}</div>
                  </td>
                  <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="mono" style={{ fontWeight: "750", color: "var(--vb-teal)" }}>
                    ₹{inv.grandTotal.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge-vb ${getStatusBadge(inv.status)}`}>{inv.status}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="btn-vb btn-vb-secondary"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <Eye size={12} style={{ marginRight: "4px" }} /> Open Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
