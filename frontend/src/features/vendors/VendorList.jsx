import { useState, useEffect, useCallback } from "react";
import { vendorApi } from "../../api/vendors";
import { usePolling } from "../../hooks/usePolling";
import {
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Plus,
  X,
  Shield,
  FileCheck
} from "lucide-react";
import "./Vendors.css";

export default function VendorList() {
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedVendorDetails, setSelectedVendorDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    email: "",
    phone: "",
    contactName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    stateCode: "",
    postalCode: "",
    gstin: "",
    pan: "",
    categoryId: "",
    status: "ACTIVE",
    paymentTerms: "NET30",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await vendorApi.getCategories();
        setCategories(res.data || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Poll vendors every 10 seconds
  const fetchVendors = useCallback(() => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.categoryId = categoryFilter;
    return vendorApi.getAll(params);
  }, [search, statusFilter, categoryFilter]);

  const { data, loading, error, refetch } = usePolling(fetchVendors, 10000);
  const vendors = data?.data || [];

  // Load specific vendor details
  const handleSelectVendor = async (vendor) => {
    setSelectedVendor(vendor);
    setLoadingDetails(true);
    try {
      const res = await vendorApi.getById(vendor.id);
      setSelectedVendorDetails(res.data);
    } catch (err) {
      console.error("Failed to load vendor details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await vendorApi.create(formData);
      setFormData({
        name: "",
        legalName: "",
        email: "",
        phone: "",
        contactName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        stateCode: "",
        postalCode: "",
        gstin: "",
        pan: "",
        categoryId: "",
        status: "ACTIVE",
        paymentTerms: "NET30",
        notes: "",
      });
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "ACTIVE": return "badge-vb-teal";
      case "INACTIVE": return "badge-vb-subtle";
      case "BLACKLISTED": return "badge-vb-coral";
      case "PENDING_REVIEW": return "badge-vb-amber";
      default: return "badge-vb-subtle";
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px" }}>Vendors</h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px" }}>Centralized suppliers directory and compliance center</p>
        </div>
        <button className="btn-vb btn-vb-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      {/* Add Vendor Form Drawer/Modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-content card-panel slide-down" style={{ maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2>New Supplier Profile</h2>
              <button className="logout-btn" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            {formError && <div className="btn-vb btn-vb-danger" style={{ display: "block", marginBottom: "16px", padding: "10px" }}>{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group-vb">
                  <label>Display Name *</label>
                  <input className="input-vb" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. TechSupply Corp" required />
                </div>
                <div className="form-group-vb">
                  <label>Legal Name</label>
                  <input className="input-vb" name="legalName" value={formData.legalName} onChange={handleChange} placeholder="e.g. TechSupply Solutions Pvt Ltd" />
                </div>
                <div className="form-group-vb">
                  <label>Email *</label>
                  <input className="input-vb" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="contact@techsupply.com" required />
                </div>
                <div className="form-group-vb">
                  <label>Phone</label>
                  <input className="input-vb" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91-9876543210" />
                </div>
                <div className="form-group-vb">
                  <label>Contact Person</label>
                  <input className="input-vb" name="contactName" value={formData.contactName} onChange={handleChange} placeholder="Rohan Kumar" />
                </div>
                <div className="form-group-vb">
                  <label>Category</label>
                  <select className="select-vb" name="categoryId" value={formData.categoryId} onChange={handleChange}>
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group-vb">
                  <label>GSTIN</label>
                  <input className="input-vb" name="gstin" value={formData.gstin} onChange={handleChange} placeholder="29BBBBB2222B2Z2" />
                </div>
                <div className="form-group-vb">
                  <label>PAN</label>
                  <input className="input-vb" name="pan" value={formData.pan} onChange={handleChange} placeholder="BBBBB2222B" />
                </div>
                <div className="form-group-vb">
                  <label>Payment Terms</label>
                  <select className="select-vb" name="paymentTerms" value={formData.paymentTerms} onChange={handleChange}>
                    <option value="IMMEDIATE">Immediate</option>
                    <option value="NET15">NET 15</option>
                    <option value="NET30">NET 30</option>
                    <option value="NET60">NET 60</option>
                  </select>
                </div>
                <div className="form-group-vb">
                  <label>Status</label>
                  <select className="select-vb" name="status" value={formData.status} onChange={handleChange}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "10px" }}>
                <div className="form-group-vb">
                  <label>Address Line 1</label>
                  <input className="input-vb" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Building, Street" />
                </div>
                <div className="form-group-vb">
                  <label>City</label>
                  <input className="input-vb" name="city" value={formData.city} onChange={handleChange} placeholder="Bengaluru" />
                </div>
                <div className="form-group-vb">
                  <label>State Code (GST)</label>
                  <input className="input-vb" name="stateCode" value={formData.stateCode} onChange={handleChange} placeholder="KA" />
                </div>
              </div>

              <div className="form-group-vb" style={{ marginTop: "10px" }}>
                <label>Notes</label>
                <textarea className="textarea-vb" name="notes" value={formData.notes} onChange={handleChange} placeholder="Supplier capabilities, bank info, or terms..." rows={3} />
              </div>

              <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
                <button type="button" className="btn-vb btn-vb-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-vb btn-vb-primary" disabled={submitting}>
                  {submitting ? "SavingSupplier..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      <div className="card-panel" style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "240px" }} className="input-vb">
          <Search size={16} style={{ color: "var(--vb-text-subtle)" }} />
          <input
            type="text"
            placeholder="Search suppliers by name, email, PAN, GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", color: "var(--vb-text)", outline: "none", width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <select className="select-vb" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLACKLISTED">Blacklisted</option>
            <option value="PENDING_REVIEW">Pending Review</option>
          </select>
          <select className="select-vb" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-two-col">
        {/* Suppliers List Table */}
        <div className="table-panel-vb">
          {loading && vendors.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--vb-text-muted)" }}>Loading suppliers...</div>
          ) : error ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--vb-coral)" }}>
              <p>⚠️ {error}</p>
              <button className="btn-vb btn-vb-secondary" style={{ marginTop: "12px" }} onClick={refetch}>Retry</button>
            </div>
          ) : vendors.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--vb-text-subtle)" }}>No suppliers found. Create one to begin.</div>
          ) : (
            <table className="table-vb">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Contact Person</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Rating</th>
                  <th style={{ textAlign: "right" }}>Quotations</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id} onClick={() => handleSelectVendor(v)} style={{ cursor: "pointer", backgroundColor: selectedVendor?.id === v.id ? "var(--vb-ink-800)" : "" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="user-avatar" style={{ borderRadius: "50%", background: "var(--vb-ink-800)", border: "1px solid var(--vb-border)" }}>
                          <Building2 size={14} style={{ color: "var(--vb-teal)" }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--vb-text)" }}>{v.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--vb-text-subtle)" }}>{v.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {v.category ? (
                        <span className="badge-vb badge-vb-subtle">{v.category.name}</span>
                      ) : "—"}
                    </td>
                    <td style={{ color: "var(--vb-text-muted)" }}>{v.contactName || "—"}</td>
                    <td>
                      <span className={`badge-vb ${getStatusBadgeClass(v.status)}`}>
                        {v.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 600, color: "var(--vb-amber)" }}>
                      {v.rating > 0 ? (
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                          <Star size={12} fill="currentColor" /> {v.rating.toFixed(1)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="mono" style={{ textAlign: "right", color: "var(--vb-text-muted)" }}>{v._count?.quotations || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Supplier Profile Detail Drawer */}
        <div className="card-panel" style={{ alignSelf: "start" }}>
          {!selectedVendor ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--vb-text-subtle)" }}>
              <Building2 size={40} style={{ margin: "0 auto 16px", display: "block", color: "var(--vb-border)" }} />
              <h4>No Supplier Selected</h4>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>Select a supplier row to inspect credentials, address info, tax records, and activity.</p>
            </div>
          ) : loadingDetails ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--vb-text-muted)" }}>Loading supplier profile...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Profile Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "18px" }}>{selectedVendorDetails?.name}</h3>
                  <span style={{ fontSize: "12px", color: "var(--vb-text-subtle)" }}>{selectedVendorDetails?.legalName || "No Legal Name Registered"}</span>
                </div>
                <span className={`badge-vb ${getStatusBadgeClass(selectedVendorDetails?.status)}`}>
                  {selectedVendorDetails?.status}
                </span>
              </div>

              {/* Quick Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ backgroundColor: "var(--vb-ink-950)", padding: "10px", borderRadius: "6px", border: "1px solid var(--vb-border-soft)", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "var(--vb-text-subtle)", textTransform: "uppercase" }}>Rating</div>
                  <div className="mono" style={{ fontSize: "18px", color: "var(--vb-amber)", fontWeight: 700, marginTop: "4px" }}>
                    {selectedVendorDetails?.rating > 0 ? `${selectedVendorDetails.rating.toFixed(1)} / 5.0` : "None"}
                  </div>
                </div>
                <div style={{ backgroundColor: "var(--vb-ink-950)", padding: "10px", borderRadius: "6px", border: "1px solid var(--vb-border-soft)", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "var(--vb-text-subtle)", textTransform: "uppercase" }}>Terms</div>
                  <div className="mono" style={{ fontSize: "18px", color: "var(--vb-teal)", fontWeight: 700, marginTop: "4px" }}>
                    {selectedVendorDetails?.paymentTerms || "NET30"}
                  </div>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--vb-border-soft)" }} />

              {/* Compliance & Contact */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--vb-text-muted)" }}>Supplier Metadata</h4>
                
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <Shield size={14} style={{ color: "var(--vb-text-subtle)" }} />
                  <div>
                    <span style={{ color: "var(--vb-text-subtle)" }}>GSTIN: </span>
                    <span className="mono">{selectedVendorDetails?.gstin || "Not provided"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <FileCheck size={14} style={{ color: "var(--vb-text-subtle)" }} />
                  <div>
                    <span style={{ color: "var(--vb-text-subtle)" }}>PAN: </span>
                    <span className="mono">{selectedVendorDetails?.pan || "Not provided"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <Mail size={14} style={{ color: "var(--vb-text-subtle)" }} />
                  <div>
                    <span style={{ color: "var(--vb-text-subtle)" }}>Email: </span>
                    <span>{selectedVendorDetails?.email}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <Phone size={14} style={{ color: "var(--vb-text-subtle)" }} />
                  <div>
                    <span style={{ color: "var(--vb-text-subtle)" }}>Phone: </span>
                    <span className="mono">{selectedVendorDetails?.phone || "Not provided"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px" }}>
                  <MapPin size={14} style={{ color: "var(--vb-text-subtle)", marginTop: "2px" }} />
                  <div>
                    <span style={{ color: "var(--vb-text-subtle)" }}>Address: </span>
                    <div style={{ color: "var(--vb-text)", marginTop: "2px" }}>
                      {selectedVendorDetails?.addressLine1 ? (
                        <>
                          {selectedVendorDetails.addressLine1}<br />
                          {selectedVendorDetails.addressLine2 && <>{selectedVendorDetails.addressLine2}<br /></>}
                          {selectedVendorDetails.city}, {selectedVendorDetails.state} ({selectedVendorDetails.stateCode})
                        </>
                      ) : "No address registered"}
                    </div>
                  </div>
                </div>
              </div>

              {selectedVendorDetails?.notes && (
                <>
                  <hr style={{ border: "none", borderTop: "1px solid var(--vb-border-soft)" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--vb-text-muted)" }}>Internal Notes</h4>
                    <p style={{ fontSize: "12.5px", color: "var(--vb-text-muted)" }}>{selectedVendorDetails.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
