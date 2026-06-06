// Sidebar layout with navigation

import { NavLink, Outlet } from "react-router-dom";
import "./Layout.css";

const navItems = [
  { to: "/",         icon: "📊", label: "Dashboard" },
  { to: "/vendors",  icon: "🏢", label: "Vendors" },
  { to: "/rfqs",     icon: "📋", label: "RFQs" },
  { to: "/quotations", icon: "💰", label: "Quotations" },
];

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🌉</span>
          <h1>VendorBridge</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item--active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <span className="user-name">Admin</span>
              <span className="user-role">Procurement</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
