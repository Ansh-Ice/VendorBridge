import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { rfqApi } from "../../api/rfqs";
import { vendorApi } from "../../api/vendors";
import { useAuth } from "../../hooks/useAuth";
import { Trash2, FileText, ArrowLeft, PlusCircle } from "lucide-react";
import "./RFQ.css";

export default function RFQCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
    categoryId: "",
    terms: "",
    vendorIds: [],
  });

  const [lineItems, setLineItems] = useState([
    { name: "", description: "", quantity: 1, unit: "Pcs", targetPrice: "", requiredBy: "" }
  ]);

  // Fetch vendors and categories
  useEffect(() => {
    async function loadOptions() {
      try {
        const [vendorRes, categoryRes] = await Promise.all([
          vendorApi.getAll(),
          vendorApi.getCategories(),
        ]);
        setVendors(vendorRes.data || []);
        setCategories(categoryRes.data || []);
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

  // Line item handlers
  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { name: "", description: "", quantity: 1, unit: "Pcs", targetPrice: "", requiredBy: "" }
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) return; // keep at least one
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate line items
    const invalidItems = lineItems.filter(item => !item.name.trim() || !item.quantity || parseFloat(item.quantity) <= 0);
    if (invalidItems.length > 0) {
      setError("Please complete all line items with valid names and quantities.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        deadline: formData.deadline || null,
        categoryId: formData.categoryId || null,
        lineItems: lineItems.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity),
          targetPrice: item.targetPrice ? parseFloat(item.targetPrice) : null,
          requiredBy: item.requiredBy || null,
        })),
        createdById: user.id
      };

      await rfqApi.create(payload);
      navigate("/rfqs");
    } catch (err) {
      setError(err.message || "Failed to create RFQ");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter vendors based on selected category to make invitation recommendation
  const filteredVendors = formData.categoryId
    ? vendors.filter((v) => v.categoryId === formData.categoryId)
    : vendors;

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
            <FileText size={28} className="text-teal" />
            Create Request for Quotation
          </h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px" }}>
            Design a new procurement request, specify item requisitions, and invite qualified vendors.
          </p>
        </div>
        <button className="btn-vb btn-vb-secondary" onClick={() => navigate("/rfqs")}>
          <ArrowLeft size={16} /> Back to RFQs
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card-panel" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {error && (
          <div className="badge-vb badge-vb-coral" style={{ width: "100%", padding: "12px", borderRadius: "8px", justifyContent: "center" }}>
            ⚠️ {error}
          </div>
        )}

        {/* 1. General details */}
        <div>
          <h3 style={{ fontSize: "16px", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid var(--vb-border-soft)", color: "var(--vb-teal)" }}>
            1. RFQ Metadata & Summary
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
            <div className="form-group-vb">
              <label>RFQ Title *</label>
              <input
                className="input-vb"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Q3 Hardware and Desk Procurement"
                required
              />
            </div>
            
            <div className="form-group-vb">
              <label>Vendor Category *</label>
              <select
                className="select-vb"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-vb">
              <label>Total Budget (INR)</label>
              <input
                className="input-vb"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                placeholder="e.g. 150000"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group-vb">
              <label>Deadline Date *</label>
              <input
                className="input-vb"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginTop: "12px" }}>
            <div className="form-group-vb">
              <label>Description & Scope</label>
              <textarea
                className="textarea-vb"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Specify general terms, quality guidelines, or overview..."
                rows={3}
              />
            </div>
            <div className="form-group-vb">
              <label>Standard Delivery & Payment Terms</label>
              <textarea
                className="textarea-vb"
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                placeholder="e.g. Delivery within 14 days, Payment Net 30, GSTIN invoice required..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* 2. Line Items Table */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid var(--vb-border-soft)" }}>
            <h3 style={{ fontSize: "16px", color: "var(--vb-teal)" }}>
              2. Line Item Requisitions
            </h3>
            <button type="button" className="btn-vb btn-vb-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={addLineItem}>
              <PlusCircle size={14} /> Add Line Item
            </button>
          </div>

          <div className="table-panel-vb">
            <table className="table-vb">
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>Item Name *</th>
                  <th style={{ width: "25%" }}>Description</th>
                  <th style={{ width: "12%" }}>Qty *</th>
                  <th style={{ width: "10%" }}>Unit *</th>
                  <th style={{ width: "13%" }}>Target (INR)</th>
                  <th style={{ width: "5%", textAlign: "center" }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        className="input-vb"
                        style={{ padding: "6px 10px" }}
                        placeholder="Item name (e.g. Dell Latitude 5440)"
                        value={item.name}
                        onChange={(e) => handleLineItemChange(idx, "name", e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        className="input-vb"
                        style={{ padding: "6px 10px" }}
                        placeholder="Optional details"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input-vb"
                        style={{ padding: "6px 10px" }}
                        type="number"
                        min="0.1"
                        step="any"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(idx, "quantity", e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        className="input-vb"
                        style={{ padding: "6px 10px" }}
                        placeholder="Pcs/Units"
                        value={item.unit}
                        onChange={(e) => handleLineItemChange(idx, "unit", e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        className="input-vb"
                        style={{ padding: "6px 10px" }}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Target Price"
                        value={item.targetPrice}
                        onChange={(e) => handleLineItemChange(idx, "targetPrice", e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="btn-vb-danger"
                        style={{ border: "none", background: "none", cursor: "pointer", color: "var(--vb-coral)", padding: "4px" }}
                        disabled={lineItems.length === 1}
                        onClick={() => removeLineItem(idx)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Invite Vendors */}
        <div>
          <h3 style={{ fontSize: "16px", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid var(--vb-border-soft)", color: "var(--vb-teal)" }}>
            3. Vendor Invitations
          </h3>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "13px", marginBottom: "14px" }}>
            {formData.categoryId
              ? "Showing vendors registered under the selected category."
              : "Select a Category above to filter vendors, or select from all available vendors."}
          </p>

          {filteredVendors.length === 0 ? (
            <div className="badge-vb badge-vb-subtle" style={{ display: "flex", padding: "16px", justifyContent: "center" }}>
              No active vendors available under this category.
            </div>
          ) : (
            <div className="vendor-checkbox-grid">
              {filteredVendors.map((v) => (
                <label key={v.id} className="vendor-checkbox" style={{
                  backgroundColor: formData.vendorIds.includes(v.id) ? "var(--vb-ink-800)" : "var(--vb-ink-950)",
                  borderColor: formData.vendorIds.includes(v.id) ? "var(--vb-teal)" : "var(--vb-border)"
                }}>
                  <input
                    type="checkbox"
                    checked={formData.vendorIds.includes(v.id)}
                    onChange={() => handleVendorToggle(v.id)}
                  />
                  <div className="vendor-checkbox-info">
                    <span className="vendor-name" style={{ color: "var(--vb-text)" }}>{v.name}</span>
                    <span className="vendor-email" style={{ color: "var(--vb-text-muted)" }}>{v.email}</span>
                    {v.category && (
                      <span className="badge-vb badge-vb-teal" style={{ fontSize: "9px", padding: "1px 6px", alignSelf: "flex-start", marginTop: "4px" }}>
                        {v.category.name}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--vb-border-soft)", paddingTop: "20px" }}>
          <button type="button" className="btn-vb btn-vb-secondary" onClick={() => navigate("/rfqs")} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-vb btn-vb-primary" disabled={submitting}>
            {submitting ? "Publishing RFQ..." : "Create & Publish RFQ"}
          </button>
        </div>
      </form>
    </div>
  );
}
