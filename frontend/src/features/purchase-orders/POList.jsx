import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { poApi } from "../../api/purchaseOrders";
import { usePolling } from "../../hooks/usePolling";
import {
  FileCheck,
  Eye
} from "lucide-react";

export default function POList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");

  const fetchPOs = useCallback(
    () => poApi.getAll(statusFilter ? { status: statusFilter } : {}),
    [statusFilter]
  );
  
  const { data, loading, error, refetch } = usePolling(fetchPOs, 10000);
  const pos = data?.data || [];

  const statuses = ["", "ISSUED", "SENT", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"];

  const getStatusBadge = (status) => {
    switch (status) {
      case "DRAFT": return "badge-vb-subtle";
      case "ISSUED": return "badge-vb-cobalt";
      case "SENT": return "badge-vb-teal";
      case "PARTIALLY_RECEIVED": return "badge-vb-amber";
      case "COMPLETED": return "badge-vb-lime";
      case "CANCELLED": return "badge-vb-coral";
      default: return "badge-vb-subtle";
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
            <FileCheck size={28} className="text-teal" />
            Purchase Orders (POs)
          </h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px" }}>
            Manage official procurement orders, delivery terms, and billing status.
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
            {s || "All POs"}
          </button>
        ))}
      </div>

      {loading && pos.length === 0 ? (
        <div className="loading-spinner">Loading purchase orders...</div>
      ) : error ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "30px" }}>
          <p style={{ color: "var(--vb-coral)", marginBottom: "16px" }}>⚠️ {error}</p>
          <button className="btn-vb btn-vb-secondary" onClick={refetch}>Retry Connection</button>
        </div>
      ) : pos.length === 0 ? (
        <div className="card-panel" style={{ textAlign: "center", padding: "48px 20px" }}>
          <p style={{ color: "var(--vb-text-muted)" }}>No Purchase Orders found in this filter.</p>
        </div>
      ) : (
        <div className="table-panel-vb">
          <table className="table-vb">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>RFQ / Requisition</th>
                <th>Invited Vendor</th>
                <th>Expected Delivery</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po.id}>
                  <td className="mono" style={{ fontWeight: "750" }}>{po.poNumber}</td>
                  <td>
                    <div style={{ fontWeight: "600" }}>{po.rfq?.title}</div>
                    <span className="mono" style={{ fontSize: "10px", color: "var(--vb-text-muted)" }}>{po.rfq?.rfqNumber}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "600" }}>{po.vendor?.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--vb-text-muted)" }}>{po.vendor?.email}</div>
                  </td>
                  <td>
                    {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : "Immediate"}
                  </td>
                  <td className="mono" style={{ fontWeight: "750", color: "var(--vb-teal)" }}>
                    ₹{po.grandTotal.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge-vb ${getStatusBadge(po.status)}`}>{po.status}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="btn-vb btn-vb-secondary"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                    >
                      <Eye size={12} style={{ marginRight: "4px" }} /> Open PO
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
