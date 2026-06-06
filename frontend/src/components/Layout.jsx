import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  FileCheck,
  CheckSquare,
  FileSpreadsheet,
  Receipt,
  Users,
  KeyRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import "./Layout.css";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNavItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["ADMIN", "PROCUREMENT_OFFICER", "APPROVER", "VENDOR"] },
    { to: "/vendors", icon: Building2, label: "Vendors", roles: ["ADMIN", "PROCUREMENT_OFFICER", "APPROVER"] },
    { to: "/rfqs", icon: ClipboardList, label: "RFQs", roles: ["ADMIN", "PROCUREMENT_OFFICER", "APPROVER"] },
    { to: "/vendor/rfqs", icon: ClipboardList, label: "Assigned RFQs", roles: ["VENDOR"] },
    { to: "/quotations", icon: FileSpreadsheet, label: "Quotations", roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"] },
    { to: "/approvals", icon: CheckSquare, label: "Approvals", roles: ["ADMIN", "APPROVER"] },
    { to: "/purchase-orders", icon: FileCheck, label: "Purchase Orders", roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"] },
    { to: "/invoices", icon: Receipt, label: "Invoices", roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"] },
    { to: "/users", icon: Users, label: "Users", roles: ["ADMIN"] },
  ];


  const filteredNavItems = allNavItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangePassword = () => {
    navigate("/change-password");
    setMobileOpen(false);
  };

  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const formattedRole = user?.role ? user.role.replace(/_/g, " ") : "User";

  return (
    <div className="layout">
      {/* Mobile Top Navbar */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="mobile-logo">VendorBridge 🌉</span>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <Building2 className="brand-logo-icon" size={24} />
          {!collapsed && <span className="brand-title">VendorBridge</span>}
          <button className="collapse-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "nav-item--active" : ""}`
                }
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : ""}
              >
                <Icon className="nav-icon" size={18} />
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">{avatarLetter}</div>
            {!collapsed && (
              <div className="user-info">
                <span className="user-name">{user?.name || "User"}</span>
                <span className="user-role">{formattedRole}</span>
              </div>
            )}
            <button className="change-password-btn" onClick={handleChangePassword} title="Change password">
              <KeyRound size={16} />
            </button>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`main-content ${collapsed ? "main-content--expanded" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
