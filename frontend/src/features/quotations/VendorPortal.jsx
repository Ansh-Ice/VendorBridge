import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { rfqApi } from "../../api/rfqs";
import { quotationApi } from "../../api/quotations";
import { useAuth } from "../../hooks/useAuth";
import { usePolling } from "../../hooks/usePolling";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  Briefcase
} from "lucide-react";
import "../rfq/RFQ.css";

export default function VendorPortal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchRfq = useCallback(() => rfqApi.getById(id), [id]);
  const { data, loading, error: fetchError } = usePolling(fetchRfq, 15000);
  const rfq = data?.data;

  const [formData, setFormData] = useState({
    shippingAmount: "0",
    discountAmount: "0",
    deliveryDays: "7",
    paymentTerms: "NET30",
    notes: "",
  });

  const [linePrices, setLinePrices] = useState([]);

  // Initialize line prices when RFQ loads
  useEffect(() => {
    if (rfq && rfq.lineItems) {
      queueMicrotask(() => {
        setLinePrices((prev) => {
          if (prev.length > 0 && prev[0].rfqLineItemId === rfq.lineItems[0].id) {
            return prev;
          }
          return rfq.lineItems.map((item) => ({
            rfqLineItemId: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: "",
            taxRate: "18.0",
            notes: "",
          }));
        });
        if (rfq.terms) {
          setFormData((prev) => ({ ...prev, paymentTerms: rfq.terms }));
        }
      });
    }
  }, [rfq]);

  const handleGeneralChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLinePriceChange = (index, field, value) => {
    setLinePrices((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Calculations
  const shipping = parseFloat(formData.shippingAmount) || 0;
  const discount = parseFloat(formData.discountAmount) || 0;

  const linesWithTotals = linePrices.map((line) => {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.unitPrice) || 0;
    const tax = parseFloat(line.taxRate) || 0;
    
    const lineSubtotal = qty * price;
    const lineTax = lineSubtotal * (tax / 100);
    const lineTotal = lineSubtotal + lineTax;

    return {
      ...line,
      lineSubtotal,
      lineTax,
      lineTotal,
    };
  });

  const calculatedSubtotal = linesWithTotals.reduce((sum, item) => sum + item.lineSubtotal, 0);
  const calculatedTax = linesWithTotals.reduce((sum, item) => sum + item.lineTax, 0);
  const grandTotal = calculatedSubtotal + calculatedTax + shipping - discount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate Unit Prices
    const invalidItems = linePrices.filter((lp) => !lp.unitPrice || parseFloat(lp.unitPrice) <= 0);
    if (invalidItems.length > 0) {
      setError("Please input a valid unit price for all line items.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        rfqId: id,
        shippingAmount: shipping,
        discountAmount: discount,
        deliveryDays: parseInt(formData.deliveryDays) || 0,
        paymentTerms: formData.paymentTerms || null,
        notes: formData.notes || null,
        lineItems: linePrices.map((lp) => ({
          rfqLineItemId: lp.rfqLineItemId,
          unitPrice: parseFloat(lp.unitPrice),
          quantity: parseFloat(lp.quantity),
          taxRate: parseFloat(lp.taxRate),
          notes: lp.notes || null,
        })),
        vendorId: user.vendorId, // provided automatically from session context
      };

      await quotationApi.create(payload);
      alert("Quotation submitted successfully!");
      navigate(`/rfqs/${id}`);
    } catch (err) {
      setError(err.message || "Failed to submit quotation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !rfq) {
    return (
      <div className="page-container" style={{ justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="loading-spinner">Loading RFQ particulars...</div>
      </div>
    );
  }

  if (fetchError || !rfq) {
    return (
      <div className="page-container">
        <button className="btn-vb btn-vb-secondary" onClick={() => navigate(`/rfqs/${id}`)}>
          <ArrowLeft size={16} /> Back to RFQ
        </button>
        <div className="card-panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <AlertCircle size={48} className="text-coral" style={{ marginBottom: "16px" }} />
          <h2>Error Loading RFQ</h2>
          <p style={{ color: "var(--vb-text-muted)", marginTop: "8px" }}>{fetchError || "RFQ not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Briefcase size={28} className="text-teal" />
            Submit Quotation Bid
          </h1>
          <p style={{ color: "var(--vb-text-muted)", fontSize: "14px" }}>
            Provide line price bids, GST tax codes, freight expectations, and delivery promises.
          </p>
        </div>
        <button className="btn-vb btn-vb-secondary" onClick={() => navigate(`/rfqs/${id}`)}>
          <ArrowLeft size={16} /> Cancel
        </button>
      </div>

      <div className="grid-two-col">
        {/* Left column: input form */}
        <form onSubmit={handleSubmit} className="card-panel" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {error && (
            <div className="badge-vb badge-vb-coral" style={{ width: "100%", padding: "12px", borderRadius: "8px", justifyContent: "center" }}>
              ⚠️ {error}
            </div>
          )}

          <div>
            <h3 style={{ fontSize: "15px", color: "var(--vb-teal)", paddingBottom: "6px", borderBottom: "1px solid var(--vb-border-soft)", marginBottom: "14px" }}>
              Line Price Bids
            </h3>

            <div className="table-panel-vb">
              <table className="table-vb">
                <thead>
                  <tr>
                    <th style={{ width: "45%" }}>Item Description</th>
                    <th style={{ width: "10%" }}>Qty</th>
                    <th style={{ width: "25%" }}>Unit Price (INR) *</th>
                    <th style={{ width: "20%" }}>GST Rate (%) *</th>
                  </tr>
                </thead>
                <tbody>
                  {linesWithTotals.map((line, idx) => (
                    <tr key={line.rfqLineItemId}>
                      <td>
                        <div style={{ fontWeight: "600" }}>{line.name}</div>
                        <span className="badge-vb badge-vb-subtle" style={{ fontSize: "9px", padding: "1px 6px", marginTop: "4px" }}>
                          {line.unit}
                        </span>
                      </td>
                      <td className="mono">{line.quantity}</td>
                      <td>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "var(--vb-text-subtle)" }}>₹</span>
                          <input
                            className="input-vb"
                            style={{ paddingLeft: "22px", paddingRight: "6px" }}
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            value={line.unitPrice}
                            onChange={(e) => handleLinePriceChange(idx, "unitPrice", e.target.value)}
                            required
                          />
                        </div>
                      </td>
                      <td>
                        <select
                          className="select-vb"
                          value={line.taxRate}
                          onChange={(e) => handleLinePriceChange(idx, "taxRate", e.target.value)}
                          required
                        >
                          <option value="0.0">0% (GST Exempt)</option>
                          <option value="5.0">5% GST</option>
                          <option value="12.0">12% GST</option>
                          <option value="18.0">18% GST (Standard)</option>
                          <option value="28.0">28% GST</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "15px", color: "var(--vb-teal)", paddingBottom: "6px", borderBottom: "1px solid var(--vb-border-soft)", marginBottom: "14px" }}>
              Commitments & Shipping
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group-vb">
                <label>Expected Delivery Days *</label>
                <input
                  className="input-vb"
                  type="number"
                  name="deliveryDays"
                  min="1"
                  placeholder="e.g. 7"
                  value={formData.deliveryDays}
                  onChange={handleGeneralChange}
                  required
                />
              </div>

              <div className="form-group-vb">
                <label>Shipping & Freight Cost (INR)</label>
                <input
                  className="input-vb"
                  type="number"
                  name="shippingAmount"
                  min="0"
                  placeholder="0.00"
                  value={formData.shippingAmount}
                  onChange={handleGeneralChange}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "10px" }}>
              <div className="form-group-vb">
                <label>Payment Terms Accepted</label>
                <input
                  className="input-vb"
                  name="paymentTerms"
                  placeholder="e.g. NET30"
                  value={formData.paymentTerms}
                  onChange={handleGeneralChange}
                />
              </div>

              <div className="form-group-vb">
                <label>Bid Discount (INR)</label>
                <input
                  className="input-vb"
                  type="number"
                  name="discountAmount"
                  min="0"
                  placeholder="0.00"
                  value={formData.discountAmount}
                  onChange={handleGeneralChange}
                />
              </div>
            </div>

            <div className="form-group-vb" style={{ marginTop: "10px" }}>
              <label>Additional Notes / Remarks</label>
              <textarea
                className="textarea-vb"
                name="notes"
                placeholder="Provide other terms or warranty information..."
                rows={3}
                value={formData.notes}
                onChange={handleGeneralChange}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--vb-border-soft)", paddingTop: "16px" }}>
            <button type="button" className="btn-vb btn-vb-secondary" onClick={() => navigate(`/rfqs/${id}`)}>
              Cancel
            </button>
            <button type="submit" className="btn-vb btn-vb-primary" disabled={submitting}>
              {submitting ? "Submitting Quotation..." : "Submit Quotation Bid"}
            </button>
          </div>
        </form>

        {/* Right column: RFQ Summary & Real-time Quote totals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* RFQ card */}
          <div className="card-panel">
            <h3 style={{ fontSize: "14px", color: "var(--vb-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
              RFQ Details
            </h3>
            <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "6px" }}>{rfq.title}</div>
            <div className="mono" style={{ fontSize: "12px", color: "var(--vb-text-muted)", marginBottom: "12px" }}>{rfq.rfqNumber}</div>
            
            {rfq.description && (
              <p style={{ fontSize: "13px", color: "var(--vb-text-muted)", lineHeight: "1.4", marginBottom: "14px" }}>
                {rfq.description}
              </p>
            )}

            <div style={{ borderTop: "1px solid var(--vb-border-soft)", paddingTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "10px", color: "var(--vb-text-muted)", textTransform: "uppercase" }}>Deadline</span>
                <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", gap: "6px", alignItems: "center" }}>
                  <Clock size={12} className="text-teal" />
                  {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : "None"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "10px", color: "var(--vb-text-muted)", textTransform: "uppercase" }}>Category</span>
                <div style={{ fontSize: "13px", fontWeight: "600" }}>{rfq.categoryId ? "Assigned" : "General"}</div>
              </div>
            </div>
          </div>

          {/* Real-time totals card */}
          <div className="card-panel" style={{ backgroundColor: "rgba(32, 211, 178, 0.02)", border: "1px solid var(--vb-teal)" }}>
            <h3 style={{ fontSize: "14px", color: "var(--vb-teal)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
              Bid Computation Summary
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "var(--vb-text-muted)" }}>Bid Subtotal</span>
                <span className="mono" style={{ fontWeight: "600" }}>₹{calculatedSubtotal.toLocaleString()}</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "var(--vb-text-muted)" }}>Estimated GST Tax</span>
                <span className="mono" style={{ fontWeight: "600" }}>₹{calculatedTax.toLocaleString()}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "var(--vb-text-muted)" }}>Freight & Shipping</span>
                <span className="mono" style={{ fontWeight: "600" }}>₹{shipping.toLocaleString()}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--vb-coral)" }}>
                  <span>Discounts Applied</span>
                  <span className="mono" style={{ fontWeight: "600" }}>- ₹{discount.toLocaleString()}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--vb-border)", paddingTop: "12px", fontSize: "16px", fontWeight: "750" }}>
                <span style={{ color: "var(--vb-text)" }}>Grand Bid Total</span>
                <span className="mono" style={{ color: "var(--vb-teal)" }}>₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
