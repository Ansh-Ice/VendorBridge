// VendorBridge — Public Landing Page Overhaul

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  FileText,
  FileSpreadsheet,
  CheckSquare,
  FileCheck,
  Receipt,
  ArrowRight,
  Shield,
  Layers,
  Zap,
  Globe,
  Terminal,
  Lock,
  Check,
  TrendingUp,
  Building,
  Activity
} from "lucide-react";
import "./Landing.css";

// 1. Terminal log streams pool defined statically outside component to prevent render dependency triggers
const logPool = [
  "INIT: Tenancy isolation container loaded.",
  "SYS: Organization session validated: org_c573d.",
  "DB: Document counter fetched index: RFQ-FY26-0009.",
  "API: Invited supplier credentials mapped for TechSupply.",
  "GST: State code check: Vendor (KA) != Org (MH) -> Inter-state IGST mode.",
  "SEQ: Total amount exceeds ₹50,000 threshold. Sequential flow locked.",
  "PO: Award payload parsed. Locked sequence code: PO-FY26-0004.",
  "MAIL: Dispatched purchase order copy to vendor portal: queued."
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [terminalLogs, setTerminalLogs] = useState([logPool[0], logPool[1]]);
  const [isL2Approved, setIsL2Approved] = useState(false);
  const [liveSpend, setLiveSpend] = useState(14198400);
  
  const timerRef = useRef(null);

  useEffect(() => {
    let logIndex = 1;

    const interval = setInterval(() => {
      setTerminalLogs((prev) => {
        logIndex = (logIndex + 1) % logPool.length;
        const nextLogs = [...prev, logPool[logIndex]];
        if (nextLogs.length > 5) {
          nextLogs.shift();
        }
        return nextLogs;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  // 2. Spend total live counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSpend((prev) => prev + Math.floor(Math.random() * 1800) + 400);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // 3. Workflow Auto-rotation
  useEffect(() => {
    if (isAutoPlaying) {
      timerRef.current = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % 5);
      }, 7000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoPlaying]);

  const handleStepClick = (index) => {
    setIsAutoPlaying(false);
    setActiveStep(index);
  };

  const pipelineSteps = [
    {
      title: "RFQ Requisition",
      desc: "Draft items, target budgets, and specify units, then broadcast invites to vendor pools.",
      icon: FileText,
      color: "var(--vb-cobalt)"
    },
    {
      title: "Supplier Bidding",
      desc: "Suppliers receive secure invites, input unit pricing, tax rates, and submit quotes directly.",
      icon: FileSpreadsheet,
      color: "var(--vb-teal)"
    },
    {
      title: "Sequential Approvals",
      desc: "Quotations > ₹50,000 route through sequential manager verification steps in real-time.",
      icon: CheckSquare,
      color: "var(--vb-amber)"
    },
    {
      title: "Purchase Order Award",
      desc: "Instantly issue formal PO contracts with sequential, organization-wide transaction numbers.",
      icon: FileCheck,
      color: "var(--vb-lime)"
    },
    {
      title: "GST Invoice Settlement",
      desc: "Auto-splits tax rules (CGST, SGST, IGST) from PO receipts to ensure audit compliance.",
      icon: Receipt,
      color: "var(--vb-violet)"
    }
  ];

  // Render mockups based on selected step
  const renderPreviewMockup = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="mockup-content-wrap">
            <div className="mockup-header-row">
              <div>
                <span className="mockup-badge mockup-badge-warning" style={{ marginRight: "8px" }}>DRAFT</span>
                <span className="mockup-title">RFQ-FY26-0009</span>
              </div>
              <div className="mockup-meta">Created By: Procurement Officer</div>
            </div>
            <p style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "var(--vb-text)" }}>
              Server Infrastructure Refresh
            </p>
            <table className="mockup-table">
              <thead>
                <tr>
                  <th>Line Item</th>
                  <th>Quantity</th>
                  <th>Target Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Enterprise Rack Servers (2U)</td>
                  <td>2 units</td>
                  <td>₹2,50,000</td>
                </tr>
                <tr>
                  <td>Management Console Terminals</td>
                  <td>2 units</td>
                  <td>₹50,000</td>
                </tr>
              </tbody>
            </table>
            <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: "var(--vb-text-subtle)", marginTop: "auto" }}>
              <span>Category: Cloud Infrastructure</span>
              <span>•</span>
              <span>Invited Vendors: 2</span>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="mockup-content-wrap">
            <div className="mockup-header-row">
              <div>
                <span className="mockup-badge mockup-badge-primary" style={{ marginRight: "8px" }}>SUBMITTED</span>
                <span className="mockup-title">QT-FY26-0008</span>
              </div>
              <div className="mockup-meta">Vendor: TechSupply Corp</div>
            </div>
            <div className="mockup-comparison-grid">
              <div className="comparison-vendor-card comparison-vendor-card--selected">
                <div className="comparison-header">
                  <span className="comparison-name">TechSupply Corp</span>
                  <span className="mockup-badge mockup-badge-success">LOWEST PRICE</span>
                </div>
                <div className="comparison-price">₹6,69,600</div>
                <div className="comparison-row-item">
                  <span>Subtotal:</span>
                  <span>₹5,70,000</span>
                </div>
                <div className="comparison-row-item">
                  <span>Lead Time:</span>
                  <span>8 days</span>
                </div>
                <div className="comparison-row-item">
                  <span>Terms:</span>
                  <span>NET30</span>
                </div>
              </div>
              <div className="comparison-vendor-card">
                <div className="comparison-header">
                  <span className="comparison-name">CloudLink Systems</span>
                </div>
                <div className="comparison-price">₹7,20,000</div>
                <div className="comparison-row-item">
                  <span>Subtotal:</span>
                  <span>₹6,10,000</span>
                </div>
                <div className="comparison-row-item">
                  <span>Lead Time:</span>
                  <span>14 days</span>
                </div>
                <div className="comparison-row-item">
                  <span>Terms:</span>
                  <span>NET15</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="mockup-content-wrap approval-rail-mockup">
            <div className="mockup-header-row">
              <span className="mockup-title">Sequential Approval Queue</span>
              <span className="mockup-meta">Threshold Rule: &gt; ₹50,000</span>
            </div>
            <div className="approval-step-box approval-step-box--done">
              <div className="approval-step-status-icon">
                <Check size={12} />
              </div>
              <div className="approval-step-connector" />
              <div className="approval-step-info">
                <div className="approval-step-header">
                  <span>Level 1: Finance Budget Check</span>
                  <span className="text-lime">APPROVED</span>
                </div>
                <div className="approval-step-body">
                  Authorized by Finance Manager. Budget allocation confirmed.
                </div>
              </div>
            </div>
            <div className={`approval-step-box ${isL2Approved ? "approval-step-box--done" : "approval-step-box--pending"}`}>
              <div className="approval-step-status-icon">
                {isL2Approved ? <Check size={12} /> : <span>L2</span>}
              </div>
              <div className="approval-step-info">
                <div className="approval-step-header">
                  <span>Level 2: Executive Management</span>
                  <span className={isL2Approved ? "text-lime" : "text-amber"}>
                    {isL2Approved ? "APPROVED" : "PENDING AUTHORIZATION"}
                  </span>
                </div>
                <div className="approval-step-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Requires authorization from Director of Operations.</span>
                  {!isL2Approved && (
                    <button
                      onClick={() => setIsL2Approved(true)}
                      className="btn-vb btn-vb-primary"
                      style={{ padding: "6px 12px", fontSize: "11px", borderRadius: "4px" }}
                    >
                      Click to Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="mockup-content-wrap" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="mockup-header-row">
              <span className="mockup-title">Purchase Order Preview</span>
              <span className="mockup-badge mockup-badge-success">ISSUED</span>
            </div>
            <div className="po-mockup-document">
              <div className="po-mockup-header">
                <div>
                  <div style={{ fontWeight: "800", fontSize: "14px" }}>VENDORBRIDGE CORP</div>
                  <div style={{ fontSize: "10px", color: "#6F7B8C" }}>Bandra Kurla Complex, Mumbai</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "750", fontSize: "13px" }}>PURCHASE ORDER</div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--vb-font-mono)" }}>PO-FY26-0004</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBlock: "8px" }}>
                <div>
                  <strong>Vendor:</strong> TechSupply Corp (Karnataka, IN)
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>Date:</strong> {new Date().toLocaleDateString("en-IN")}
                </div>
              </div>
              <table className="mockup-table po-mockup-lines">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Enterprise Rack Servers (2U)</td>
                    <td style={{ textAlign: "right" }}>2</td>
                    <td style={{ textAlign: "right" }}>₹2,40,000</td>
                    <td style={{ textAlign: "right" }}>₹4,80,000</td>
                  </tr>
                  <tr>
                    <td>Management Console Drawer</td>
                    <td style={{ textAlign: "right" }}>2</td>
                    <td style={{ textAlign: "right" }}>₹45,000</td>
                    <td style={{ textAlign: "right" }}>₹90,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="mockup-content-wrap gst-calculation-box">
            <div className="mockup-header-row">
              <span className="mockup-title">Indian GST Split Calculations</span>
              <span className="mockup-meta">Tax Address Mapping</span>
            </div>
            <div className="gst-mismatch-alert">
              <strong>State Mismatch Detected:</strong>
              <div style={{ marginTop: "4px" }}>
                Client Org: Maharashtra (State Code <strong>MH</strong>) <br />
                Vendor Address: Karnataka (State Code <strong>KA</strong>)
              </div>
            </div>
            <div className="gst-split-row">
              <span>Tax Base Subtotal:</span>
              <span>₹5,70,000.00</span>
            </div>
            <div className="gst-split-row text-teal">
              <span>CGST (Same State - 0%):</span>
              <span>₹0.00</span>
            </div>
            <div className="gst-split-row text-teal">
              <span>SGST (Same State - 0%):</span>
              <span>₹0.00</span>
            </div>
            <div className="gst-split-row text-cobalt">
              <span>IGST (Inter-state - 18%):</span>
              <span>₹1,02,600.00</span>
            </div>
            <div className="gst-split-row" style={{ fontWeight: "750", borderTop: "2px solid var(--vb-border)" }}>
              <span>Total Settlement Amount:</span>
              <span>₹6,72,600.00</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="landing-layout">
      {/* Dynamic Moving Mesh Glows */}
      <div className="mesh-glow-container">
        <div className="mesh-glow-orb orb-teal" />
        <div className="mesh-glow-orb orb-cobalt" />
        <div className="mesh-glow-orb orb-violet" />
      </div>

      {/* Navigation Bar */}
      <header className="landing-nav">
        <div className="landing-brand">
          <Globe className="brand-logo-icon" size={22} />
          <span>VendorBridge</span>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {isAuthenticated ? (
            <Link to="/" className="btn-vb btn-vb-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
              Enterprise Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-vb btn-vb-secondary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                Console Login
              </Link>
              <Link to="/register" className="btn-vb btn-vb-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                Register Workspace
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="section-tag" style={{ marginBottom: "20px" }}>
            <Zap size={11} /> ENTERPRISE PROCURE-TO-PAY PLATFORM
          </div>
          <h1>
            Automated Procurement.<br />
            <span className="text-glow-gradient">Audit-Safe Logistics.</span>
          </h1>
          <p className="hero-lead">
            Orchestrate multi-tenant operations from a single dashboard. Run RFQs, gather supplier bids, evaluate matrices, route sequential approvals, and settle compliant GST invoices.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/" className="btn-vb btn-vb-primary">
                Access Workspace Console <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-vb btn-vb-primary">
                  Create Workspace
                </Link>
                <Link to="/login" className="btn-vb btn-vb-secondary">
                  Explore Demo Session
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live Terminal Console Mockup */}
        <div className="hero-visualization">
          <div className="hero-console-mockup">
            <div className="console-header">
              <div className="console-dots">
                <div className="console-dot dot-red" />
                <div className="console-dot dot-yellow" />
                <div className="console-dot dot-green" />
              </div>
              <div className="console-title">sys_monitor.sh</div>
              <Terminal size={14} style={{ color: "var(--vb-text-subtle)" }} />
            </div>
            <div className="console-body">
              <div className="console-stats-grid">
                <div className="stat-item-box">
                  <span className="stat-item-label">LEDGER VOL</span>
                  <span className="stat-item-value text-teal">
                    ₹{liveSpend.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="stat-item-box">
                  <span className="stat-item-label">COMPLIANCE RATIO</span>
                  <span className="stat-item-value text-cobalt">99.94%</span>
                </div>
              </div>
              <div className="console-terminal-lines">
                {terminalLogs.map((log, index) => (
                  <div key={index} className="terminal-line">
                    <span className="terminal-prompt">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Connective Bridge Section */}
      <section className="landing-workflow-section">
        <div className="section-title-wrap">
          <div className="section-tag">
            <Activity size={11} style={{ marginRight: "6px" }} /> WORKFLOW PIPELINE
          </div>
          <h2>Connective Procurement Lifecycle</h2>
          <p className="section-subtitle">
            Experience the automated pipeline transitions from initial requisition to financial ledger invoice settlement.
          </p>
        </div>

        <div className="workflow-interactive-grid">
          {/* Stepper Rail */}
          <div className="workflow-steps-rail">
            {pipelineSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === activeStep;
              return (
                <div
                  key={idx}
                  className={`workflow-interactive-node ${isActive ? "workflow-interactive-node--active" : ""}`}
                  onClick={() => handleStepClick(idx)}
                  style={{ "--accent": step.color }}
                >
                  <div className="workflow-node-icon">
                    <StepIcon size={18} />
                  </div>
                  <div className="workflow-node-info">
                    <div className="workflow-node-title">{step.title}</div>
                    <div className="workflow-node-desc">{step.desc}</div>
                  </div>
                  {idx < 4 && <div className="workflow-connector-line" />}
                </div>
              );
            })}
          </div>

          {/* Dynamic Mockup Window Display */}
          <div className="workflow-console-display">
            <div className="preview-bar">
              <div className="preview-tab-pill">
                <Terminal size={12} className="text-teal" />
                <span>console_preview.sh</span>
              </div>
              <div className="console-dots">
                <div className="console-dot dot-red" />
                <div className="console-dot dot-yellow" />
                <div className="console-dot dot-green" />
              </div>
            </div>
            <div className="preview-content-area">
              {renderPreviewMockup()}
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section className="landing-features-bento">
        <div className="section-title-wrap">
          <div className="section-tag">
            <Shield size={11} style={{ marginRight: "6px" }} /> SECURITY & ARCHITECTURE
          </div>
          <h2>Engineered for Strict Operations</h2>
          <p className="section-subtitle">
            A secure foundation optimized for compliance, audit safety, and performance.
          </p>
        </div>

        <div className="bento-grid-container">
          <div className="bento-card-panel bento-col-2">
            <div className="bento-card-visual" style={{ justifyContent: "flex-start" }}>
              <div style={{ width: "80%" }}>
                <div className="stat-item-label" style={{ marginBottom: "8px" }}>Live Ledger Settlement Stream</div>
                <svg className="sparkline-svg">
                  <path className="sparkline-path" d="M 0 40 Q 30 20 60 45 T 120 15 T 180 35 T 240 10 T 300 30 T 360 15 T 420 40" />
                </svg>
              </div>
            </div>
            <h3 className="bento-card-title">Indian GST Audit Compliance</h3>
            <p className="bento-card-desc">
              Automated state code checks resolve billing profiles dynamically, executing local CGST + SGST or inter-state IGST tax transactions error-free.
            </p>
          </div>

          <div className="bento-card-panel bento-row-2">
            <div className="bento-card-visual">
              <Lock size={64} className="text-cobalt" style={{ filter: "drop-shadow(0 0 16px var(--vb-cobalt-glow))" }} />
            </div>
            <h3 className="bento-card-title">Tenant Data Isolation</h3>
            <p className="bento-card-desc">
              All active directories, vendor accounts, pricing catalogs, and document counters are isolated under Organization partitions.
            </p>
          </div>

          <div className="bento-card-panel">
            <div className="bento-card-visual">
              <TrendingUp size={48} className="text-teal" />
            </div>
            <h3 className="bento-card-title">Analytics & Trends</h3>
            <p className="bento-card-desc">
              Aggregate purchase catalogs, filter vendor performance records, and export detailed CSV balance reports instantly.
            </p>
          </div>

          <div className="bento-card-panel bento-col-2">
            <div className="bento-card-visual" style={{ gap: "24px" }}>
              <Building size={32} className="text-muted" />
              <div style={{ height: "2px", width: "80px", backgroundColor: "var(--vb-border)" }} />
              <CheckSquare size={32} className="text-teal" />
              <div style={{ height: "2px", width: "80px", backgroundColor: "var(--vb-border)" }} />
              <FileCheck size={32} className="text-lime" />
            </div>
            <h3 className="bento-card-title">Sequential Approvals</h3>
            <p className="bento-card-desc">
              Budget limits evaluate dynamically. Bids exceeding the ₹50,000 threshold enforce multi-level manager approval steps prior to contract PO awards.
            </p>
          </div>
        </div>
      </section>

      {/* Closing Call-To-Action Card */}
      <section className="landing-cta-section">
        <div className="cta-gradient-card">
          <div className="section-tag">
            <Layers size={11} style={{ marginRight: "6px" }} /> GET STARTED
          </div>
          <h2>Ready to audit-proof your procurement?</h2>
          <p>
            Join modern organizations who coordinate supply chains, evaluate bids, and handle compliance under a single unified dashboard.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            {isAuthenticated ? (
              <Link to="/" className="btn-vb btn-vb-primary">
                Return to Workspace Console <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-vb btn-vb-primary">
                  Register Workspace
                </Link>
                <Link to="/login" className="btn-vb btn-vb-secondary">
                  Explore Demo System
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="landing-footer">
        <div className="footer-top-grid">
          <div className="footer-brand-info">
            <div className="landing-brand">
              <Globe className="brand-logo-icon" size={20} />
              <span>VendorBridge</span>
            </div>
            <p>
              Automated procurement operations, secure supply chains, and transaction compliance.
            </p>
          </div>
          <div>
            <div className="footer-column-title">Platform</div>
            <ul className="footer-links-list">
              <li><Link to="/login" className="footer-link">Login Console</Link></li>
              <li><Link to="/register" className="footer-link">Register Workspace</Link></li>
              <li><Link to="/landing" className="footer-link">Interactive Demo</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-column-title">Compliance</div>
            <ul className="footer-links-list">
              <li><a href="#" className="footer-link">Indian GST Rules</a></li>
              <li><a href="#" className="footer-link">Multi-Tenant Isolation</a></li>
              <li><a href="#" className="footer-link">Audit Trail Logging</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-column-title">Company</div>
            <ul className="footer-links-list">
              <li><a href="#" className="footer-link">Security Audits</a></li>
              <li><a href="#" className="footer-link">Privacy Policy</a></li>
              <li><a href="#" className="footer-link">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <div>© {new Date().getFullYear()} VendorBridge ERP. All rights reserved. Built for secure supply chains.</div>
          <div>Designed for high-fidelity compliance.</div>
        </div>
      </footer>
    </div>
  );
}
