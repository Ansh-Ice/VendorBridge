import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import {
  Building2,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  FileCheck,
  Receipt,
  ArrowRight,
  DollarSign
} from "lucide-react";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vendors: 0,
    rfqs: 0,
    quotations: 0,
    approvals: 0,
    pos: 0,
    invoices: 0,
    spending: 0,
  });
  const [recentRfqs, setRecentRfqs] = useState([]);
  const [recentPOs, setRecentPOs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const promises = [
          api.get("/rfqs"),
        ];

        // Fetch based on user roles
        if (user.role !== "VENDOR") {
          promises.push(api.get("/vendors"));
          promises.push(api.get("/quotations"));
          promises.push(api.get("/approvals?status=PENDING"));
          promises.push(api.get("/purchase-orders"));
          promises.push(api.get("/invoices"));
        } else {
          promises.push(api.get("/quotations?vendorId=" + user.vendorId));
          promises.push(api.get("/purchase-orders?vendorId=" + user.vendorId));
          promises.push(api.get("/invoices?vendorId=" + user.vendorId));
        }

        const results = await Promise.all(promises);
        
        const rfqRes = results[0];
        
        if (user.role !== "VENDOR") {
          const vendorRes = results[1];
          const quoteRes = results[2];
          const approvalRes = results[3];
          const poRes = results[4];
          const invoiceRes = results[5];

          const totalSpend = (poRes.data || []).reduce((sum, item) => sum + (item.grandTotal || 0), 0);

          setStats({
            vendors: vendorRes.count || 0,
            rfqs: rfqRes.count || 0,
            quotations: quoteRes.count || 0,
            approvals: approvalRes.count || 0,
            pos: poRes.count || 0,
            invoices: invoiceRes.count || 0,
            spending: totalSpend,
          });

          setRecentRfqs((rfqRes.data || []).slice(0, 5));
          setRecentPOs((poRes.data || []).slice(0, 5));
        } else {
          const quoteRes = results[1];
          const poRes = results[2];
          const invoiceRes = results[3];

          const totalEarnings = (poRes.data || []).reduce((sum, item) => sum + (item.grandTotal || 0), 0);

          setStats({
            vendors: 0,
            rfqs: rfqRes.count || 0,
            quotations: quoteRes.count || 0,
            approvals: 0,
            pos: poRes.count || 0,
            invoices: invoiceRes.count || 0,
            spending: totalEarnings,
          });

          setRecentRfqs((rfqRes.data || []).slice(0, 5));
          setRecentPOs((poRes.data || []).slice(0, 5));
        }
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="page-container" style={{ justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="loading-spinner">Loading command center dashboard...</div>
      </div>
    );
  }

  // Define role specific cards
  const isVendor = user.role === "VENDOR";

  const cards = isVendor
    ? [
        { label: "Invited RFQs", value: stats.rfqs, icon: FileText, color: "var(--vb-cobalt)", to: "/rfqs" },
        { label: "Submitted Bids", value: stats.quotations, icon: FileSpreadsheet, color: "var(--vb-teal)", to: "/quotations" },
        { label: "Sales POs", value: stats.pos, icon: FileCheck, color: "var(--vb-lime)", to: "/purchase-orders" },
        { label: "Tax Invoices", value: stats.invoices, icon: Receipt, color: "var(--vb-violet)", to: "/invoices" },
      ]
    : [
        { label: "Active Vendors", value: stats.vendors, icon: Building2, color: "var(--vb-cobalt)", to: "/vendors" },
        { label: "Bidding RFQs", value: stats.rfqs, icon: FileText, color: "var(--vb-teal)", to: "/rfqs" },
        { label: "Pending Approvals", value: stats.approvals, icon: CheckSquare, color: "var(--vb-amber)", to: "/approvals" },
        { label: "Invoiced Revenue", value: stats.invoices, icon: Receipt, color: "var(--vb-violet)", to: "/invoices" },
      ];

  const formattedSpending = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(stats.spending);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "750" }}>Command Center</h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Welcome back, {user.name}. Scoped to tenant organization ID: <span className="mono" style={{ fontSize: "12px", color: "var(--vb-teal)" }}>{user.organizationId.slice(0, 8)}...</span>
          </p>
        </div>
        {!isVendor && (
          <Link to="/rfqs/create" className="btn-vb btn-vb-primary">
            + Create Request for Quotation
          </Link>
        )}
      </div>

      {/* Bento grid metric section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
        {/* Spending Card */}
        <div className="card-panel" style={{ display: "flex", alignItems: "center", gap: "16px", background: "linear-gradient(135deg, var(--vb-ink-900) 0%, rgba(32, 211, 178, 0.05) 100%)", borderColor: "var(--vb-border)" }}>
          <div className="badge-vb badge-vb-teal" style={{ padding: "12px", borderRadius: "10px" }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: "11px", color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {isVendor ? "Total Billing Revenue" : "Total Procurement Volume"}
            </span>
            <div className="mono" style={{ fontSize: "20px", fontWeight: "750", color: "var(--vb-teal)", marginTop: "2px" }}>
              {formattedSpending}
            </div>
          </div>
        </div>

        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link to={card.to} key={card.label} className="card-panel stat-card-link" style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none", color: "inherit", transition: "transform 0.15s ease, border-color 0.15s ease" }}>
              <div className="badge-vb" style={{ padding: "12px", borderRadius: "10px", backgroundColor: card.color + "15", color: card.color, borderColor: card.color + "25" }}>
                <Icon size={24} />
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {card.label}
                </span>
                <div className="mono" style={{ fontSize: "20px", fontWeight: "750", marginTop: "2px" }}>
                  {card.value}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Grid split */}
      <div className="grid-two-col">
        {/* Recent RFQs */}
        <div className="card-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px" }}>Bidding Requisition Pipeline</h3>
            <Link to="/rfqs" style={{ fontSize: "12px", color: "var(--vb-teal)", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
              View Pipeline <ArrowRight size={14} />
            </Link>
          </div>

          {recentRfqs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--vb-text-muted)" }}>
              No active RFQ pipelines.
            </div>
          ) : (
            <div className="table-panel-vb" style={{ border: "none" }}>
              <table className="table-vb">
                <thead>
                  <tr>
                    <th>RFQ #</th>
                    <th>RFQ Title</th>
                    <th>Status</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRfqs.map((rfq) => (
                    <tr key={rfq.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/rfqs/${rfq.id}`)}>
                      <td className="mono" style={{ fontSize: "11px" }}>{rfq.rfqNumber}</td>
                      <td style={{ fontWeight: "600" }}>{rfq.title}</td>
                      <td>
                        <span className={`badge-vb badge-vb-subtle`} style={{ fontSize: "10px", padding: "2px 8px" }}>
                          {rfq.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--vb-text-muted)" }}>
                        {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent POs */}
        <div className="card-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px" }}>Recent Purchase Orders</h3>
            <Link to="/purchase-orders" style={{ fontSize: "12px", color: "var(--vb-teal)", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
              View POs <ArrowRight size={14} />
            </Link>
          </div>

          {recentPOs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--vb-text-muted)" }}>
              No purchase orders issued yet.
            </div>
          ) : (
            <div className="table-panel-vb" style={{ border: "none" }}>
              <table className="table-vb">
                <thead>
                  <tr>
                    <th>PO #</th>
                    <th>Grand Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPOs.map((po) => (
                    <tr key={po.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                      <td className="mono" style={{ fontWeight: "600" }}>{po.poNumber}</td>
                      <td className="mono" style={{ fontWeight: "600", color: "var(--vb-teal)" }}>
                        ₹{po.grandTotal.toLocaleString()}
                      </td>
                      <td>
                        <span className="badge-vb badge-vb-subtle" style={{ fontSize: "10px", padding: "2px 8px" }}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
