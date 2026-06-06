// Vendor List page — displays all vendors with add vendor modal

import { useState, useCallback } from "react";
import { vendorApi } from "../../api/vendors";
import { usePolling } from "../../hooks/usePolling";
import "./Vendors.css";

export default function VendorList() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", category: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [search, setSearch] = useState("");

  // Poll vendors every 10 seconds
  const fetchVendors = useCallback(
    () => vendorApi.getAll(search ? { search } : {}),
    [search]
  );
  const { data, loading, error, refetch } = usePolling(fetchVendors, 10000);
  const vendors = data?.data || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await vendorApi.create(formData);
      setFormData({ name: "", email: "", phone: "", address: "", category: "" });
      setShowForm(false);
      refetch();
    } catch (err) {
      setFormError(err.message || "Failed to create vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="vendors-page">
      <div className="page-header">
        <div>
          <h1>Vendors</h1>
          <p className="page-subtitle">Manage your vendor directory</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Vendor"}
        </button>
      </div>

      {/* Add Vendor Form */}
      {showForm && (
        <div className="form-card slide-down">
          <h3>New Vendor</h3>
          {formError && <div className="form-error">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="vendor-name">Name *</label>
                <input id="vendor-name" name="name" value={formData.name}
                  onChange={handleChange} placeholder="Vendor name" required />
              </div>
              <div className="form-group">
                <label htmlFor="vendor-email">Email *</label>
                <input id="vendor-email" name="email" type="email" value={formData.email}
                  onChange={handleChange} placeholder="vendor@example.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="vendor-phone">Phone</label>
                <input id="vendor-phone" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="+1-555-0000" />
              </div>
              <div className="form-group">
                <label htmlFor="vendor-category">Category</label>
                <select id="vendor-category" name="category" value={formData.category}
                  onChange={handleChange}>
                  <option value="">Select category</option>
                  <option value="IT Services">IT Services</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label htmlFor="vendor-address">Address</label>
                <input id="vendor-address" name="address" value={formData.address}
                  onChange={handleChange} placeholder="Full address" />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Creating..." : "Create Vendor"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search vendors by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Vendor Table */}
      {loading ? (
        <div className="loading-spinner">Loading vendors...</div>
      ) : error ? (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button className="btn btn-ghost" onClick={refetch}>Retry</button>
        </div>
      ) : vendors.length === 0 ? (
        <div className="empty-state">
          <p>No vendors found. Add your first vendor above.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Category</th>
                <th>Contact</th>
                <th>Status</th>
                <th>RFQs</th>
                <th>Quotes</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className="vendor-info">
                      <div className="vendor-avatar">{v.name.charAt(0)}</div>
                      <div>
                        <div className="vendor-name">{v.name}</div>
                        <div className="vendor-email">{v.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {v.category ? (
                      <span className="badge badge-category">{v.category}</span>
                    ) : "—"}
                  </td>
                  <td className="td-secondary">{v.phone || "—"}</td>
                  <td>
                    <span className={`badge badge-${v.status.toLowerCase()}`}>
                      {v.status}
                    </span>
                  </td>
                  <td>{v._count?.rfqVendors || 0}</td>
                  <td>{v._count?.quotations || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
