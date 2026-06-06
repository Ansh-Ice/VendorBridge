// Admin — User Management Page
import { useState, useCallback } from "react";
import { userApi } from "../../api/users";
import { useAuth } from "../../hooks/useAuth";
import { usePolling } from "../../hooks/usePolling";
import {
  Users,
  Plus,
  Shield,
  X,
  UserCheck,
  Mail
} from "lucide-react";

const ROLE_COLORS = {
  ADMIN: "badge-vb-coral",
  PROCUREMENT_OFFICER: "badge-vb-cobalt",
  APPROVER: "badge-vb-amber",
  VENDOR: "badge-vb-teal",
};

const ROLE_LABELS = {
  ADMIN: "Admin",
  PROCUREMENT_OFFICER: "Procurement",
  APPROVER: "Approver",
  VENDOR: "Vendor",
};

export default function UserList() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "password123",
    role: "PROCUREMENT_OFFICER",
    vendorId: "",
  });

  const fetchUsers = useCallback(() => userApi.getAll(), []);
  const { data, loading, error, refetch } = usePolling(fetchUsers, 15000);
  const users = data?.data || [];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userApi.create({
        ...formData,
        vendorId: formData.vendorId || null,
      });
      setShowForm(false);
      setFormData({ name: "", email: "", password: "password123", role: "PROCUREMENT_OFFICER", vendorId: "" });
      refetch();
    } catch (err) {
      alert(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Users size={28} className="text-teal" />
            User Management
          </h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Manage organization members, roles, and access levels.
          </p>
        </div>
        <button
          className="btn-vb btn-vb-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Invite User"}
        </button>
      </div>

      {/* Create User Form */}
      {showForm && (
        <div className="card-panel">
          <h3 style={{ marginBottom: "20px", fontSize: "16px" }}>Invite New Team Member</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group-vb">
                <label>Full Name *</label>
                <input
                  className="input-vb"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div className="form-group-vb">
                <label>Email Address *</label>
                <input
                  className="input-vb"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@yourcompany.com"
                  required
                />
              </div>
              <div className="form-group-vb">
                <label>Role *</label>
                <select className="select-vb" name="role" value={formData.role} onChange={handleChange}>
                  <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                  <option value="APPROVER">Approver / Finance Manager</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                  <option value="VENDOR">Vendor Portal User</option>
                </select>
              </div>
              <div className="form-group-vb">
                <label>Temporary Password</label>
                <input
                  className="input-vb"
                  name="password"
                  type="text"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>
            {formData.role === "VENDOR" && (
              <div className="form-group-vb">
                <label>Vendor ID (required for vendor portal users)</label>
                <input
                  className="input-vb"
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleChange}
                  placeholder="UUID of vendor record"
                />
              </div>
            )}
            <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
              <button type="submit" className="btn-vb btn-vb-primary" disabled={submitting}>
                <UserCheck size={16} />
                {submitting ? "Creating..." : "Create User Account"}
              </button>
              <button type="button" className="btn-vb btn-vb-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="card-panel" style={{ padding: 0, overflow: "hidden" }}>
        {loading && users.length === 0 ? (
          <div className="loading-spinner">Loading team directory...</div>
        ) : error ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--vb-coral)" }}>
            ⚠️ {error}
          </div>
        ) : (
          <div className="table-panel-vb" style={{ border: "none", borderRadius: 0 }}>
            <table className="table-vb">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--vb-teal), var(--vb-cobalt))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "13px", fontWeight: "700", color: "#070A0F", flexShrink: 0
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: "600" }}>{u.name}</span>
                        {u.id === user?.id && (
                          <span style={{ fontSize: "10px", color: "var(--vb-teal)", fontWeight: "600" }}>(YOU)</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--vb-text-muted)" }}>
                        <Mail size={12} />
                        {u.email}
                      </div>
                    </td>
                    <td>
                      <span className={`badge-vb ${ROLE_COLORS[u.role] || "badge-vb-subtle"}`}>
                        <Shield size={9} style={{ marginRight: "4px" }} />
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-vb ${u.status === "ACTIVE" ? "badge-vb-lime" : "badge-vb-subtle"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--vb-text-muted)", fontSize: "13px" }}>
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : <span style={{ opacity: 0.5 }}>Never</span>}
                    </td>
                    <td style={{ color: "var(--vb-text-muted)", fontSize: "13px" }}>
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats footer */}
      {users.length > 0 && (
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {Object.entries(ROLE_LABELS).map(([role, label]) => {
            const count = users.filter((u) => u.role === role).length;
            if (count === 0) return null;
            return (
              <div key={role} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--vb-text-muted)" }}>
                <span className={`badge-vb ${ROLE_COLORS[role]}`}>{label}</span>
                <span>{count} {count === 1 ? "member" : "members"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
