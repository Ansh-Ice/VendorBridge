// RFQ Create form — create a new Request for Quotation

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { rfqApi } from "../../api/rfqs";
import { vendorApi } from "../../api/vendors";
import { userApi } from "../../api/users";
import "./RFQ.css";

export default function RFQCreate() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
    createdById: "",
    vendorIds: [],
  });

  // Fetch vendors and users for dropdowns
  useEffect(() => {
    async function loadOptions() {
      try {
        const [vendorRes, userRes] = await Promise.all([
          vendorApi.getAll(),
          userApi.getAll(),
        ]);
        setVendors(vendorRes.data || []);
        const userData = userRes.data || [];
        setUsers(userData);
        // Auto-select first user
        if (userData.length > 0 && !formData.createdById) {
          setFormData((prev) => ({ ...prev, createdById: userData[0].id }));
        }
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    }
    loadOptions();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVendorToggle = (vendorId) => {
    setFormData((prev) => ({
      ...prev,
      vendorIds: prev.vendorIds.includes(vendorId)
        ? prev.vendorIds.filter((id) => id !== vendorId)
        : [...prev.vendorIds, vendorId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await rfqApi.create({
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      });
      navigate("/rfqs");
    } catch (err) {
      setError(err.message || "Failed to create RFQ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rfq-page">
      <div className="page-header">
        <div>
          <h1>Create RFQ</h1>
          <p className="page-subtitle">Create a new Request for Quotation</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate("/rfqs")}>
          ← Back to RFQs
        </button>
      </div>

      <div className="form-card">
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="rfq-title">Title *</label>
              <input
                id="rfq-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Q3 Laptop Procurement"
                required
              />
            </div>
            <div className="form-group full-width">
              <label htmlFor="rfq-description">Description</label>
              <textarea
                id="rfq-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what you need from vendors..."
                rows={4}
              />
            </div>
            <div className="form-group">
              <label htmlFor="rfq-budget">Budget ($)</label>
              <input
                id="rfq-budget"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                placeholder="75000"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label htmlFor="rfq-deadline">Deadline</label>
              <input
                id="rfq-deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="rfq-creator">Created By *</label>
              <select
                id="rfq-creator"
                name="createdById"
                value={formData.createdById}
                onChange={handleChange}
                required
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendor Selection */}
          <div className="vendor-select-section">
            <label>Invite Vendors</label>
            <p className="field-hint">Select vendors to invite to this RFQ</p>
            {vendors.length === 0 ? (
              <p className="td-secondary">No vendors available. Create vendors first.</p>
            ) : (
              <div className="vendor-checkbox-grid">
                {vendors.map((v) => (
                  <label key={v.id} className="vendor-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.vendorIds.includes(v.id)}
                      onChange={() => handleVendorToggle(v.id)}
                    />
                    <div className="vendor-checkbox-info">
                      <span className="vendor-name">{v.name}</span>
                      <span className="vendor-email">{v.category || v.email}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate("/rfqs")}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating..." : "Create RFQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
